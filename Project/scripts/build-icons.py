"""
Build every Stage app icon from the master artwork.

    python Project/scripts/build-icons.py [path/to/master.png] [--preview out.png]
    python Project/scripts/build-icons.py --plain [--preview out.png]   # no-border master (current app icon)

Master: assets/Logo/StagewithBorder.png (2000x2000 — white Stage mark on a red
radial gradient, white rounded-square rim near the edge).

Why this exists
---------------
The launcher, not the app, decides an icon's outer shape. Android cuts the
adaptive icon with whatever mask the launcher uses (circle on Pixel, squircle
on Samsung, rounded square / teardrop elsewhere) and iOS cuts its own rounded
corners. The master's rim hugs the canvas edge with tiny corners, so every one
of those masks sliced it off and the border vanished or looked broken.

So instead of shipping the master as-is, the icon is REBUILT per platform from
three parts measured off the master:

  1. the background — the master's radial red gradient (measured profile),
  2. the mark       — the white Stage mark + its drop shadow, lifted out with
                      true alpha (no re-drawing, pixel-faithful to the master),
  3. the rim        — redrawn as a rounded square whose geometry is chosen so
                      the WHOLE border is visible under every mask:

     Android adaptive (108dp canvas, launchers show the middle 72dp and only
     guarantee a 66dp-diameter circle): the rim's outer edge is fitted inside
     that safe circle, corner radius included, so circle / squircle / rounded
     square / teardrop masks all show the complete border. The rim lives in
     the BACKGROUND layer — launchers parallax-shift the foreground, which
     would slide the rim off-centre.

     iOS / expo.icon (1024, full bleed, iOS applies ~22.4% corner radius): the
     rim is inset and its corners made concentric with the iOS mask.

     Legacy Android (< 8.0) square + round bitmaps: pre-shaped here.

The mark is always scaled with the rim, so the mark-to-border proportions of
the master are preserved everywhere.
"""

import math
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(HERE)
LOGO = os.path.join(PROJECT, "assets", "Logo")
RES = os.path.join(PROJECT, "android", "app", "src", "main", "res")

SS = 4  # supersampling factor for anti-aliased shapes

# ---------------------------------------------------------------------------
# Master analysis
# ---------------------------------------------------------------------------


def analyse_master(path):
    img = np.asarray(Image.open(path).convert("RGB")).astype(np.float64)
    h, w, _ = img.shape
    R, G = img[..., 0], img[..., 1]

    # Rim: the white run nearest each edge along the centre row / column.
    white = G > 200
    row, col = white[h // 2], white[:, w // 2]
    xs, ys = np.where(row)[0], np.where(col)[0]
    left, right = xs.min(), xs.max()
    top, bottom = ys.min(), ys.max()
    # Rim thickness: length of the first white run.
    thick = int(np.argmax(~row[left:])) or 30
    cx, cy = (left + right) / 2.0, (top + bottom) / 2.0
    rim_half = ((right - left) + (bottom - top)) / 4.0  # outer half-width

    yy, xx = np.mgrid[0:h, 0:w]
    dist = np.hypot(xx - cx, yy - cy)

    # Everything white inside the rim = the mark.
    inner = np.zeros_like(white)
    m = thick + 60
    inner[top + m:bottom - m, left + m:right - m] = True
    markish = (G > 60) & inner
    near = np.asarray(
        Image.fromarray((markish * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(41))
    ) > 0

    # Background gradient: the master is pure red (G = B = 0) — R as a
    # function of distance from the rim centre. Median per ring, sampled
    # away from the mark, its shadow and the rim.
    rim_band = np.zeros_like(white)
    rim_band[top - 8:bottom + 9, left - 8:right + 9] = True
    rim_band[top + thick + 8:bottom - thick - 8, left + thick + 8:right - thick - 8] = False
    sel = (~near) & (G < 20) & (~rim_band)
    step = 6
    bins = (dist[sel] // step).astype(int)
    vals = R[sel]
    nb = int(dist.max() // step) + 1
    prof = np.full(nb, np.nan)
    for b in range(nb):
        v = vals[bins == b]
        if len(v) > 30:
            prof[b] = np.median(v)
    good = ~np.isnan(prof)
    centres = (np.arange(nb) + 0.5) * step
    prof = np.interp(centres, centres[good], prof[good])
    # Light smoothing — the median is already robust; this just removes steps.
    k = np.ones(9) / 9.0
    prof = np.convolve(np.pad(prof, 4, mode="edge"), k, mode="valid")

    # Mark layer with true alpha.
    #   white mark : G rises from 0 (red bg) to 255 (white) -> alpha = G/255
    #   shadow     : R drops below the local background     -> alpha = 1 - R/bg
    bg_at = np.interp(dist, centres, prof)
    mark_a = np.clip((G - 4) / 247.0, 0, 1)
    mark_a[~near] = 0
    shadow_a = np.clip(1.0 - R / np.maximum(bg_at, 1.0), 0, 1)
    shadow_a[(~near) | (mark_a > 0.02)] = 0
    shadow_a[shadow_a < 0.06] = 0

    # Composite as straight-alpha RGBA: white over dark shadow.
    a = mark_a + shadow_a * (1 - mark_a)
    # Shadow colour must be black: alpha was measured as 1 - R/bg, i.e. as a
    # black overlay, so black reproduces the master's shadow pixel-for-pixel.
    shadow_col = np.array([0.0, 0.0, 0.0])
    rgb = (mark_a[..., None] * 255.0 + (1 - mark_a[..., None]) * shadow_a[..., None] * shadow_col) / np.maximum(
        a[..., None], 1e-6
    )
    layer = np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)
    mark = Image.fromarray(layer, "RGBA")

    return {
        "size": (w, h),
        "centre": (cx, cy),
        "rim_half": rim_half,
        "rim_thick": thick,
        "profile": (centres, prof),
        "mark": mark,
    }


# ---------------------------------------------------------------------------
# Rendering primitives (all in output pixels, supersampled)
# ---------------------------------------------------------------------------


def rounded_square_mask(size, half, radius, centre=None):
    """Anti-aliased alpha (float 0..1) of a rounded square."""
    n = size * SS
    c = (centre or (size / 2.0, size / 2.0))
    cx, cy = c[0] * SS, c[1] * SS
    h, r = half * SS, radius * SS
    yy, xx = np.mgrid[0:n, 0:n] + 0.5
    qx = np.abs(xx - cx) - (h - r)
    qy = np.abs(yy - cy) - (h - r)
    outside = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r
    m = (outside <= 0).astype(np.float32)
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((size, size), Image.LANCZOS)) / 255.0


def circle_mask(size, radius):
    n = size * SS
    yy, xx = np.mgrid[0:n, 0:n] + 0.5
    m = (np.hypot(xx - n / 2, yy - n / 2) <= radius * SS).astype(np.float32)
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((size, size), Image.LANCZOS)) / 255.0


def gradient(size, master, rim_half_px):
    """The master's radial gradient, scaled so the rim maps to `rim_half_px`."""
    k = master["rim_half"] / rim_half_px  # master px per output px
    centres, prof = master["profile"]
    yy, xx = np.mgrid[0:size, 0:size] + 0.5
    d = np.hypot(xx - size / 2.0, yy - size / 2.0) * k
    r = np.interp(d, centres, prof)
    out = np.zeros((size, size, 4), np.float64)
    out[..., 0] = r
    out[..., 3] = 255
    return out


def over(dst, src_rgb, src_a):
    """Straight-alpha 'over' compositing onto a float RGBA canvas."""
    a = src_a[..., None]
    da = dst[..., 3:4] / 255.0
    out_a = a + da * (1 - a)
    rgb = (src_rgb * a + dst[..., :3] * da * (1 - a)) / np.maximum(out_a, 1e-6)
    dst[..., :3] = rgb
    dst[..., 3:4] = out_a * 255
    return dst


def mark_layer(size, master, rim_half_px):
    """The mark (+ shadow) scaled with the rim, on a transparent canvas."""
    k = rim_half_px / master["rim_half"]
    mw, mh = master["size"]
    scaled = master["mark"].resize((max(1, round(mw * k)), max(1, round(mh * k))), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx, cy = master["centre"]
    ox = round(size / 2.0 - cx * k)
    oy = round(size / 2.0 - cy * k)
    # The scaled master can overhang the canvas (its outer margin is just the
    # transparent area around the mark): crop the overhang, then composite.
    sx, sy = max(0, -ox), max(0, -oy)
    part = scaled.crop((sx, sy, min(scaled.width, sx + size - max(ox, 0)), min(scaled.height, sy + size - max(oy, 0))))
    canvas.alpha_composite(part, (max(ox, 0), max(oy, 0)))
    return np.asarray(canvas).astype(np.float64)


def rim(size, half, radius, thick):
    outer = rounded_square_mask(size, half, radius)
    inner = rounded_square_mask(size, half - thick, max(radius - thick, 0.5))
    return np.clip(outer - inner, 0, 1)


def to_image(arr):
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")


# ---------------------------------------------------------------------------
# Geometry (fractions of the canvas)
# ---------------------------------------------------------------------------

# Android adaptive: 108dp canvas; the 66dp-diameter circle is never clipped.
ADAPTIVE_DP = 108.0
SAFE_R_DP = 33.0 - 0.6  # keep a hair inside the guaranteed circle
RIM_RADIUS_DP = 13.0
# Largest rim whose rounded corners still sit inside the safe circle:
#   (half - r) * sqrt(2) + r <= SAFE_R
RIM_HALF_DP = (SAFE_R_DP - RIM_RADIUS_DP) / math.sqrt(2) + RIM_RADIUS_DP
RIM_THICK_DP = 2.0  # thicker than the master's ~1dp so it survives 48dp icons

# iOS / expo.icon: full bleed 1024, iOS corner radius ~22.37% of the side.
IOS_INSET = 0.055
IOS_CORNER = 0.2237


def adaptive_layers(px, master):
    s = px / ADAPTIVE_DP
    half, radius, thick = RIM_HALF_DP * s, RIM_RADIUS_DP * s, RIM_THICK_DP * s
    bg = gradient(px, master, half)
    ring = rim(px, half, radius, thick)
    bg = over(bg, np.full((px, px, 3), 255.0), ring)
    fg = mark_layer(px, master, half)
    return to_image(bg), to_image(fg)


def ios_icon(px, master):
    inset = IOS_INSET * px
    half = px / 2.0 - inset
    radius = max(IOS_CORNER * px - inset, 1)
    thick = half * (RIM_THICK_DP / RIM_HALF_DP)
    canvas = gradient(px, master, half)
    canvas = over(canvas, np.full((px, px, 3), 255.0), rim(px, half, radius, thick))
    m = mark_layer(px, master, half)
    canvas = over(canvas, m[..., :3], m[..., 3] / 255.0)
    out = to_image(canvas).convert("RGB")  # iOS rejects alpha in app icons
    return out


def legacy_icons(px, master):
    """Pre-Oreo launchers draw the bitmap as-is: shape it here."""
    big = px * 4
    # Square variant: the badge itself, rim near the edge, transparent corners.
    half = big / 2.0 * 0.92
    radius = half * (RIM_RADIUS_DP / RIM_HALF_DP)
    thick = half * (RIM_THICK_DP / RIM_HALF_DP)
    sq = gradient(big, master, half)
    sq = over(sq, np.full((big, big, 3), 255.0), rim(big, half, radius, thick))
    m = mark_layer(big, master, half)
    sq = over(sq, m[..., :3], m[..., 3] / 255.0)
    sq[..., 3] *= rounded_square_mask(big, half, radius)
    square = to_image(sq).resize((px, px), Image.LANCZOS)

    # Round variant: same composition the circle mask produces on 8.0+.
    bg, fg = adaptive_layers(int(round(big * ADAPTIVE_DP / 72.0)), master)
    full = Image.alpha_composite(bg, fg)
    off = (full.width - big) // 2
    crop = full.crop((off, off, off + big, off + big))
    arr = np.asarray(crop).astype(np.float64)
    arr[..., 3] *= circle_mask(big, big / 2.0)
    rnd = to_image(arr).resize((px, px), Image.LANCZOS)
    return square, rnd


# ---------------------------------------------------------------------------
# Launcher preview (what the user actually sees)
# ---------------------------------------------------------------------------


def superellipse_mask(size, n=4.0):
    yy, xx = (np.mgrid[0:size * SS, 0:size * SS] + 0.5) / (size * SS) * 2 - 1
    m = ((np.abs(xx) ** n + np.abs(yy) ** n) <= 1).astype(np.float32)
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((size, size), Image.LANCZOS)) / 255.0


# ---------------------------------------------------------------------------
# No-border master (--plain): STAGE_Primary_No_Border - the mark on the red
# radial gradient, no white frame. With nothing at the edges to lose, the
# composition is kept exactly as designed: the master's full canvas maps onto
# the 72dp a launcher shows, the gradient becomes the adaptive BACKGROUND
# (extended past the edges by its own profile), and the mark + shadow become
# the FOREGROUND. The mark's furthest pixel sits at ~0.78 of the half-width
# = ~28dp from centre, inside the 33dp circle every launcher keeps.
# ---------------------------------------------------------------------------

VISIBLE_HALF_DP = 36.0  # half of the 72dp viewport launchers display


def analyse_plain_master(path):
    img = np.asarray(Image.open(path).convert("RGB")).astype(np.float64)
    h, w, _ = img.shape
    R, G = img[..., 0], img[..., 1]
    cx, cy = w / 2.0, h / 2.0
    yy, xx = np.mgrid[0:h, 0:w]
    dist = np.hypot(xx - cx, yy - cy)

    markish = G > 60
    near = np.asarray(
        Image.fromarray((markish * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(41))
    ) > 0

    sel = (~near) & (G < 20)
    step = 6
    bins = (dist[sel] // step).astype(int)
    vals = R[sel]
    nb = int(dist.max() // step) + 1
    prof = np.full(nb, np.nan)
    for b in range(nb):
        v = vals[bins == b]
        if len(v) > 30:
            prof[b] = np.median(v)
    good = ~np.isnan(prof)
    centres = (np.arange(nb) + 0.5) * step
    prof = np.interp(centres, centres[good], prof[good])
    k = np.ones(9) / 9.0
    prof = np.convolve(np.pad(prof, 4, mode="edge"), k, mode="valid")

    bg_at = np.interp(dist, centres, prof)
    mark_a = np.clip((G - 4) / 247.0, 0, 1)
    mark_a[~near] = 0
    shadow_a = np.clip(1.0 - R / np.maximum(bg_at, 1.0), 0, 1)
    shadow_a[(~near) | (mark_a > 0.02)] = 0
    shadow_a[shadow_a < 0.06] = 0
    a = mark_a + shadow_a * (1 - mark_a)
    # White mark over a black shadow, as straight-alpha RGB (3 channels).
    rgb = np.repeat((mark_a[..., None] * 255.0) / np.maximum(a[..., None], 1e-6), 3, axis=2)
    layer = np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)

    ys, xs = np.where(mark_a > 0.5)
    reach = float(np.hypot(xs - cx, ys - cy).max()) / (w / 2.0)
    return {
        "size": (w, h),
        "centre": (cx, cy),
        "rim_half": w / 2.0,      # reference length: the master's half-width
        "profile": (centres, prof),
        "mark": Image.fromarray(layer, "RGBA"),
        "image": Image.open(path).convert("RGB"),
        "reach": reach,
    }


def adaptive_layers_plain(px, master):
    half = VISIBLE_HALF_DP * px / ADAPTIVE_DP
    return to_image(gradient(px, master, half)), to_image(mark_layer(px, master, half))


def ios_icon_plain(px, master):
    # Full bleed, exactly the artwork - iOS applies its own rounded mask.
    return master["image"].resize((px, px), Image.LANCZOS)


def legacy_icons_plain(px, master):
    big = px * 4
    art = np.asarray(master["image"].resize((big, big), Image.LANCZOS).convert("RGBA")).astype(np.float64)
    sq = art.copy()
    sq[..., 3] *= rounded_square_mask(big, big / 2.0, big * 0.2)
    rnd = art.copy()
    rnd[..., 3] *= circle_mask(big, big / 2.0)
    return (to_image(sq).resize((px, px), Image.LANCZOS), to_image(rnd).resize((px, px), Image.LANCZOS))


def teardrop_mask(size):
    yy, xx = np.mgrid[0:size * SS, 0:size * SS] + 0.5
    n = size * SS
    r = n / 2
    circ = np.hypot(xx - r, yy - r) <= r
    corner = (xx >= r) & (yy >= r)  # bottom-right square corner
    m = (circ | corner).astype(np.float32)
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((size, size), Image.LANCZOS)) / 255.0


def preview(master, out_path, layers=None, ios=None, legacy=None):
    layers, ios, legacy = layers or adaptive_layers, ios or ios_icon, legacy or legacy_icons
    shown = 240  # px for the 72dp visible viewport
    px = int(round(shown * ADAPTIVE_DP / 72.0))
    bg, fg = layers(px, master)
    full = Image.alpha_composite(bg, fg)
    off = (px - shown) // 2
    view = np.asarray(full.crop((off, off, off + shown, off + shown))).astype(np.float64)

    masks = [
        ("Circle (Pixel)", circle_mask(shown, shown / 2.0)),
        ("Squircle (Samsung)", superellipse_mask(shown, 4.0)),
        ("Rounded square", rounded_square_mask(shown, shown / 2.0, shown * 0.18)),
        ("Teardrop", teardrop_mask(shown)),
    ]
    ios = ios(1024, master).resize((shown, shown), Image.LANCZOS)
    ios_arr = np.asarray(ios.convert("RGBA")).astype(np.float64)
    ios_arr[..., 3] *= superellipse_mask(shown, 5.0)

    tiles = [(name, to_image(np.dstack([view[..., :3], view[..., 3] * m]))) for name, m in masks]
    tiles.append(("iOS", to_image(ios_arr)))
    sq, rnd = legacy(192, master)
    tiles.append(("Android 7 square", sq.resize((shown, shown), Image.LANCZOS)))
    tiles.append(("Android 7 round", rnd.resize((shown, shown), Image.LANCZOS)))

    pad, label_h = 24, 0
    sheet = Image.new("RGBA", (len(tiles) * (shown + pad) + pad, shown + 2 * pad), (236, 236, 240, 255))
    for i, (_, t) in enumerate(tiles):
        sheet.alpha_composite(t, (pad + i * (shown + pad), pad))
    # Small sizes as they appear on a real home screen (48dp @ mdpi/xxxhdpi).
    small = Image.new("RGBA", (sheet.width, 140), (24, 24, 28, 255))
    x = pad
    for sz in (48, 72, 96, 144):
        v = Image.fromarray(np.clip(view, 0, 255).astype(np.uint8), "RGBA").resize((sz, sz), Image.LANCZOS)
        a = np.asarray(v).astype(np.float64)
        a[..., 3] *= superellipse_mask(sz, 4.0)
        small.alpha_composite(to_image(a), (x, (140 - sz) // 2))
        x += sz + pad
    out = Image.new("RGBA", (sheet.width, sheet.height + small.height))
    out.alpha_composite(sheet, (0, 0))
    out.alpha_composite(small, (0, sheet.height))
    out.convert("RGB").save(out_path)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}


def main():
    args = sys.argv[1:]
    prev = None
    if "--preview" in args:
        i = args.index("--preview")
        prev = args[i + 1]
        del args[i:i + 2]
    plain = "--plain" in args
    if plain:
        args.remove("--plain")
        master_path = args[0] if args else os.path.join(LOGO, "STAGE_Primary_No_Border.png")
        master = analyse_plain_master(master_path)
        layers_fn, ios_fn, legacy_fn = adaptive_layers_plain, ios_icon_plain, legacy_icons_plain
        reach_dp = master["reach"] * VISIBLE_HALF_DP
        print(f"plain master: mark reaches {reach_dp:.1f}dp from centre (safe circle 33dp)")
        if reach_dp > 32.5:
            sys.exit("the mark would be clipped by round launcher masks - shrink it in the artwork")
    else:
        master_path = args[0] if args else os.path.join(LOGO, "StagewithBorder.png")
        master = analyse_master(master_path)
        layers_fn, ios_fn, legacy_fn = adaptive_layers, ios_icon, legacy_icons
        print(
            f"master: rim half {master['rim_half']:.0f}px, thick {master['rim_thick']}px; "
            f"adaptive rim {RIM_HALF_DP * 2:.1f}dp of 72dp visible"
        )

    # Expo / EAS sources (used if android/ is ever regenerated by prebuild).
    bg, fg = layers_fn(1024, master)
    bg.save(os.path.join(LOGO, "adaptive-background.png"))
    fg.save(os.path.join(LOGO, "adaptive-foreground.png"))
    ios_fn(1024, master).save(os.path.join(LOGO, "app-icon.png"))

    # Native Android mipmaps — written directly (no prebuild: it would
    # clobber the hand-edited android/ tree).
    if os.path.isdir(RES):
        for name, scale in DENSITIES.items():
            d = os.path.join(RES, f"mipmap-{name}")
            os.makedirs(d, exist_ok=True)
            bg, fg = layers_fn(int(round(108 * scale)), master)
            bg.save(os.path.join(d, "ic_launcher_background.webp"), "WEBP", quality=95, method=6)
            fg.save(os.path.join(d, "ic_launcher_foreground.webp"), "WEBP", quality=95, method=6)
            sq, rnd = legacy_fn(int(round(48 * scale)), master)
            sq.save(os.path.join(d, "ic_launcher.webp"), "WEBP", quality=95, method=6)
            rnd.save(os.path.join(d, "ic_launcher_round.webp"), "WEBP", quality=95, method=6)
        print("android mipmaps written")

    # Web (Next.js site in web/): browser-tab icon = the shaped badge with
    # transparent corners (reads on light AND dark tab strips); Apple touch
    # icon = the full-bleed iOS render (iOS rounds it itself).
    web_brand = os.path.join(os.path.dirname(PROJECT), "web", "public", "brand")
    if plain:
        print("web icons left unchanged (app icon only)")
    elif os.path.isdir(web_brand):
        sq, _ = legacy_icons(512, master)
        sq.save(os.path.join(web_brand, "app-icon.png"))
        ios_icon(1024, master).resize((180, 180), Image.LANCZOS).save(os.path.join(web_brand, "apple-icon.png"))
        print("web icons written")

    if prev:
        preview(master, prev, layers_fn, ios_fn, legacy_fn)
        print("preview:", prev)


if __name__ == "__main__":
    main()
