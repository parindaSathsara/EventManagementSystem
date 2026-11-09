"""
Build the Stage logo as clean vector data from the client's master artwork.

    python Project/scripts/build-brand-svg.py

Source: Project/assets/Logo/STAGE_Primary_No_Border.png (2000x2000, the
client's mark: two slanted bars around a 7-bar sound wave).

- The two slanted bars are traced from the artwork's anti-aliased edges
  (sub-pixel marching squares, then simplified) so their shape is the
  designer's, not a re-interpretation.
- The seven wave bars are exact rounded rectangles (measured: 64 wide,
  108 apart, corner radius 18).
- "STAGE" is set in Sora ExtraBold (the app's heading font) and converted
  to outlines, so it renders identically without the font installed.

Outputs (all generated - edit this script, not the outputs):
  Project/src/shared/components/brand/brandPaths.js   (react-native-svg)
  web/components/brand-paths.ts                        (website BrandLogo)
  web/public/brand/stage-mark.svg, stage-badge.svg, stage-logo.svg,
  stage-logo-on-light.svg                              (standalone files)
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import measure
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'Project/assets/Logo/STAGE_Primary_No_Border.png')
FONT = os.path.join(ROOT, 'Project/node_modules/@expo-google-fonts/sora/800ExtraBold/Sora_800ExtraBold.ttf')


def fmt(v):
    s = f'{v:.1f}'
    if s == '-0.0':
        s = '0.0'
    return s[:-2] if s.endswith('.0') else s


# ---- 1. Mark --------------------------------------------------------------
rgb = np.asarray(Image.open(SRC).convert('RGB')).astype(float)
# White mark on a red/black background: the darkest channel is ~255 on the
# mark and low everywhere else, with true anti-aliasing on the edges.
lum = rgb.min(axis=2)
mask = lum > 200
labels, _ = ndimage.label(mask)
objs = ndimage.find_objects(labels)
comps = [i + 1 for i, s in enumerate(objs) if (labels[s] == i + 1).sum() > 2000]

slanted, bars = [], []
for c in comps:
    ys, xs = objs[c - 1]
    (slanted if xs.stop - xs.start > 500 else bars).append((c, xs, ys))

PAD = 6
x0 = min(xs.start for _, xs, _ in slanted + bars) - PAD
y0 = min(ys.start for _, _, ys in slanted + bars) - PAD
x1 = max(xs.stop for _, xs, _ in slanted + bars) + PAD
y1 = max(ys.stop for _, _, ys in slanted + bars) + PAD
MARK_W, MARK_H = x1 - x0, y1 - y0


def trace(c, xs, ys):
    """Sub-pixel outline of one component, simplified, as an SVG path."""
    m = 4
    sub = lum[ys.start - m:ys.stop + m, xs.start - m:xs.stop + m].copy()
    own = labels[ys.start - m:ys.stop + m, xs.start - m:xs.stop + m]
    # Keep only this component's neighbourhood (drop other shapes' pixels).
    grown = ndimage.binary_dilation(own == c, iterations=3)
    sub[~grown] = 0
    contour = max(measure.find_contours(sub, 128.0), key=len)
    poly = measure.approximate_polygon(contour, tolerance=0.45)
    pts = [(p[1] + xs.start - m - x0, p[0] + ys.start - m - y0) for p in poly]
    if pts[0] == pts[-1]:
        pts = pts[:-1]
    return 'M' + 'L'.join(f'{fmt(x)} {fmt(y)}' for x, y in pts) + 'Z'


def rounded_bar(xs, ys, r=18.0):
    x, y = xs.start - x0, ys.start - y0
    w, h = xs.stop - xs.start, ys.stop - ys.start
    return (f'M{fmt(x + r)} {fmt(y)}H{fmt(x + w - r)}A{fmt(r)} {fmt(r)} 0 0 1 {fmt(x + w)} {fmt(y + r)}'
            f'V{fmt(y + h - r)}A{fmt(r)} {fmt(r)} 0 0 1 {fmt(x + w - r)} {fmt(y + h)}'
            f'H{fmt(x + r)}A{fmt(r)} {fmt(r)} 0 0 1 {fmt(x)} {fmt(y + h - r)}'
            f'V{fmt(y + r)}A{fmt(r)} {fmt(r)} 0 0 1 {fmt(x + r)} {fmt(y)}Z')


mark_paths = [trace(c, xs, ys) for c, xs, ys in sorted(slanted, key=lambda t: t[2].start)]
mark_paths += [rounded_bar(xs, ys) for _, xs, ys in sorted(bars, key=lambda t: t[1].start)]

# ---- 2. Wordmark ----------------------------------------------------------
font = TTFont(FONT)
gs = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font['head'].unitsPerEm
cap_h = font['OS/2'].sCapHeight or 700
TRACK = 0.12 * upm  # letter-spacing
word_paths, pen_x = [], 0.0
for ch in 'STAGE':
    g = gs[cmap[ord(ch)]]
    pen = SVGPathPen(gs, ntos=fmt)
    # Flip y (font units are y-up) and sit the baseline at cap height.
    g.draw(TransformPen(pen, (1, 0, 0, -1, pen_x, cap_h)))
    word_paths.append(pen.getCommands())
    pen_x += g.width + TRACK
WORD_W, WORD_H = round(pen_x - TRACK, 1), cap_h

# Badge gradient: sampled from the master artwork along its radius
# (offset = distance from centre / half-diagonal).
BADGE_STOPS = [(0, '#D80000'), (0.28, '#B60000'), (0.5, '#810000'), (0.64, '#5C0100'), (1, '#050000')]
BADGE_MARK = 0.62  # mark size relative to the tile
BADGE_RADIUS = 0.225  # corner radius relative to the tile

data = {
    'mark': {'width': MARK_W, 'height': MARK_H, 'paths': mark_paths},
    'wordmark': {'width': WORD_W, 'height': WORD_H, 'paths': word_paths},
    'badge': {'markScale': BADGE_MARK, 'radius': BADGE_RADIUS,
              'stops': [{'offset': o, 'color': c} for o, c in BADGE_STOPS]},
}

# ---- 3. Emit code + standalone SVGs ---------------------------------------
HEADER = ("// GENERATED by Project/scripts/build-brand-svg.py from the client's master\n"
          "// artwork - do not edit by hand; re-run the script instead.\n")
os.makedirs(os.path.join(ROOT, 'Project/src/shared/components/brand'), exist_ok=True)
with open(os.path.join(ROOT, 'Project/src/shared/components/brand/brandPaths.js'), 'w', newline='\n') as f:
    f.write(HEADER + 'const BRAND = ' + json.dumps(data, indent=2) + ';\n\nexport default BRAND;\n')
with open(os.path.join(ROOT, 'web/components/brand-paths.ts'), 'w', newline='\n') as f:
    f.write(HEADER + 'export const BRAND = ' + json.dumps(data, indent=2) + ' as const;\n')



def svg(w, h, body, defs=''):
    d = f'<defs>{defs}</defs>' if defs else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {fmt(h)}" '
            f'width="{fmt(w)}" height="{fmt(h)}">{d}{body}</svg>\n')


def group(paths, fill, scale, tx, ty):
    return (f'<g fill="{fill}" transform="translate({fmt(tx)} {fmt(ty)}) scale({scale:.5f})">'
            + ''.join(f'<path d="{d}"/>' for d in paths) + '</g>')


BADGE_DEFS = ('<radialGradient id="g" cx="50%" cy="50%" r="70.7%">'
              + ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in BADGE_STOPS)
              + '</radialGradient>')
def badge_body(size):
    s = size * BADGE_MARK / max(MARK_W, MARK_H)
    return (f'<rect width="{fmt(size)}" height="{fmt(size)}" rx="{fmt(size * BADGE_RADIUS)}" fill="url(#g)"/>'
            + group(mark_paths, '#fff', s, (size - MARK_W * s) / 2, (size - MARK_H * s) / 2))


out = os.path.join(ROOT, 'web/public/brand')
with open(os.path.join(out, 'stage-mark.svg'), 'w', newline='\n') as f:
    f.write(svg(MARK_W, MARK_H, group(mark_paths, '#fff', 1, 0, 0)))
with open(os.path.join(out, 'stage-badge.svg'), 'w', newline='\n') as f:
    f.write(svg(512, 512, badge_body(512), BADGE_DEFS))
# Horizontal lockup: badge + STAGE; wordmark cap height = 40% of the badge.
B = 512
ws = B * 0.40 / WORD_H
gap = B * 0.28
lock_w = B + gap + WORD_W * ws
for name, color in (('stage-logo.svg', '#fff'), ('stage-logo-on-light.svg', '#0A0A0A')):
    body = badge_body(B) + group(word_paths, color, ws, B + gap, (B - WORD_H * ws) / 2)
    with open(os.path.join(out, name), 'w', newline='\n') as f:
        f.write(svg(lock_w, B, body, BADGE_DEFS))

print('mark', MARK_W, 'x', MARK_H, '| slanted pts', [p.count('L') + 1 for p in mark_paths[:2]],
      '| wordmark', WORD_W, 'x', WORD_H, '(upm', upm, ')')
print('badge stops', BADGE_STOPS)
