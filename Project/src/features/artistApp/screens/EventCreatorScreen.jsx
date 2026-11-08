import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import {
  Button,
  Chip,
  ScreenHeader,
  SquareFlyer,
} from '../../../shared/components';
import { useAlert } from '../../../shared/hooks';
import { PRICE_TBA, TEASER } from '../../../shared/utils';
import { eventsRepo } from '../../../services';
import { uploads } from '../../../services/api';

const COVER_COLORS = ['#260b3d', '#0a2a1a', '#3d1a0b', '#0d1b2a', '#5BFFC2'];

// Category presets per client feedback.
const CATEGORIES = ['Live Concert', 'EDM', 'Festival', 'Hip Hop', 'Event', 'Other'];
const AGES = ['All ages', '13+', '18+', '21+'];
const APPROVAL_MODES = ['Auto-publish', 'Submit for review'];

// Lineup slot name for artists announced later ("surprise" acts).
const REVEALED_SOON = 'Revealed Soon';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];
// An event with no end time picked runs this long by default.
const DEFAULT_DURATION_H = 4;

const COVER_GRADIENTS = [
  ['#FF3B3B', '#3d0b0b'],
  ['#00FFA1', '#0a2a1a'],
  ['#FFB020', '#3d1a0b'],
  ['#6BA8FF', '#0d1b2a'],
  ['#FF6B6B', '#1a0505'],
];

function daysInMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0).getDate();
}

function fmtHour(h) {
  const period = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${period}`;
}

/** "8 PM" / "8:30 PM" — `null` hour means nothing is picked yet. */
function fmtTime(h, m) {
  if (h == null) return null;
  const period = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return m ? `${display}:${String(m).padStart(2, '0')} ${period}` : `${display} ${period}`;
}

function pricesDigits(priceLabel) {
  // "LKR 4500" -> "4500"; "Free" / "Coming soon" -> ''.
  const m = (priceLabel || '').replace(/[,\s]/g, '').match(/(\d+)/);
  return m ? m[1] : '';
}

function isFreeLabel(priceLabel) {
  return (priceLabel || '').trim().toLowerCase() === 'free';
}

/** Minute chips — keeps a saved odd minute (e.g. :20) selectable on edit. */
function minuteOptions(...saved) {
  const set = new Set(MINUTES);
  saved.forEach((m) => { if (m != null) set.add(m); });
  return [...set].sort((a, b) => a - b);
}

/** Initial form state — either blank (create) or prefilled from `event` (edit). */
function initialState(event) {
  const now = new Date();
  const start = event?.startsAt ? new Date(event.startsAt) : null;
  const end = event?.endsAt ? new Date(event.endsAt) : null;
  const socials = event?.socials || {};
  return {
    title: event?.title || '',
    description: event?.description || '',
    category: event?.category && CATEGORIES.includes(event.category) ? event.category : (event?.category || 'Live Concert'),
    year: start ? start.getFullYear() : now.getFullYear(),
    monthIdx: start ? start.getMonth() : now.getMonth(),
    // `null` means "not picked yet". Nothing about the date or the time is
    // pre-selected on a new event — the old silent defaults (a week from
    // today, 8 PM–11:30 PM) were shipping on every event nobody touched them
    // on (client feedback 2026-08-10). Editing prefills the real values, so
    // the date and time stay changeable after publishing.
    day: start ? start.getDate() : null,
    // A day-only event carries a placeholder hour in `startsAt` — never show
    // it back to the organizer, or "to be announced" would silently become a
    // real noon start the next time they save.
    startH: start && !event?.startTimeTba ? start.getHours() : null,
    startM: start && !event?.startTimeTba ? start.getMinutes() : null,
    endH: end && !event?.startTimeTba ? end.getHours() : null,
    endM: end && !event?.startTimeTba ? end.getMinutes() : null,
    venue: event?.venueName || '',
    // Not prefilled — a default city had to be cleared on every new event
    // before the real one could be typed (client feedback 2026-08-21).
    city: event?.cityName || '',
    age: event?.ageRestriction || '18+',
    ticketUrl: event?.ticketUrl || '',
    bannerUrl: event?.bannerImageUrl || '',
    instagram: socials.instagram || '',
    facebook: socials.facebook || '',
    tiktok: socials.tiktok || '',
    // No prefilled ticket name/price — the manager types into empty boxes
    // instead of clearing "General Admission" first.
    tickets: event?.ticketTypes?.length
      ? event.ticketTypes.map((t) => ({
          name: t.name,
          price: pricesDigits(t.priceLabel),
          free: isFreeLabel(t.priceLabel),
        }))
      : [{ name: '', price: '', free: false }],
    lineup: event?.lineup?.length
      ? event.lineup.map((a) => ({
          name: a.name || '',
          instagram: a.socials?.instagram || '',
          facebook: a.socials?.facebook || '',
          tiktok: a.socials?.tiktok || '',
        }))
      : [{ name: '', instagram: '', facebook: '', tiktok: '' }],
  };
}

/**
 * Create / edit an event.
 *
 *  - Pass `event` to edit a published event (surprise artists, price changes).
 *  - Date & time are picked from selection chips — no typing.
 *  - Ticket types carry name + price only (sales happen on the third-party
 *    ticketing platform, linked via the "ticketing link" field).
 */
export default function EventCreatorScreen({ onBack, onSubmit, event }) {
  const editing = !!event?.id;
  const [form, setForm] = useState(() => initialState(event));
  const [coverIdx, setCoverIdx] = useState(0);
  const [approval, setApproval] = useState('Auto-publish');
  const [saving, setSaving] = useState(false);
  // Flyer upload state — local preview shows instantly, the uploaded URL
  // lands in form.bannerUrl once the backend accepts it.
  const [flyerPreview, setFlyerPreview] = useState(null);
  const [flyerUploading, setFlyerUploading] = useState(false);
  const [flyerProgress, setFlyerProgress] = useState(0);
  // Whole percent, always 0–100 — the service already clamps, this is the
  // belt to its braces so a bad value can never reach the layout.
  const flyerPct = Math.round(Math.min(Math.max(Number(flyerProgress) || 0, 0), 1) * 100);
  const alert = useAlert();

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  /** Pick a flyer photo (gallery or camera) and upload it to the backend. */
  async function pickFlyer(fromCamera) {
    if (flyerUploading) return;
    try {
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          alert.error('Camera not allowed', 'Allow camera access in your phone settings to capture a flyer.');
          return;
        }
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setFlyerPreview(asset.uri);
      setFlyerUploading(true);
      setFlyerProgress(0);
      const uploaded = await uploads.uploadImage(
        { uri: asset.uri, mimeType: asset.mimeType, filename: asset.fileName },
        { onProgress: setFlyerProgress },
      );
      set('bannerUrl', uploaded.url);
      alert.success('Flyer added', 'Your flyer photo is attached to this event.');
    } catch (e) {
      setFlyerPreview(null);
      alert.error('Upload failed', e?.message || 'Could not upload the flyer. Check your connection and try again.');
    } finally {
      setFlyerUploading(false);
    }
  }

  function removeFlyer() {
    setFlyerPreview(null);
    set('bannerUrl', '');
  }

  const maxDay = daysInMonth(form.year, form.monthIdx);
  // `null` until the manager picks a day — nothing is assumed for them.
  const dayClamped = form.day == null ? null : Math.min(form.day, maxDay);
  const datePicked = dayClamped != null;
  const timePicked = form.startH != null;
  const dateLabel = datePicked
    ? `${WEEKDAYS[new Date(form.year, form.monthIdx, dayClamped).getDay()]}, ${String(dayClamped).padStart(2, '0')} ${MONTHS[form.monthIdx]} ${form.year}`
    : 'Not selected yet';
  // No start time picked is a valid, deliberate state — guests are told the
  // time is coming rather than being given a made-up one.
  const startLabel = fmtTime(form.startH, form.startM) || 'To be announced';
  const endLabel = !timePicked
    ? 'To be announced'
    : fmtTime(form.endH, form.endM) ||
      `${fmtTime((form.startH + DEFAULT_DURATION_H) % 24, form.startM)} (auto)`;

  /* ---------- lineup helpers ---------- */
  function addArtist(prefillName = '') {
    setForm((f) => ({
      ...f,
      lineup: [...f.lineup, { name: prefillName, instagram: '', facebook: '', tiktok: '' }],
    }));
  }
  function updateArtist(idx, key, value) {
    setForm((f) => ({
      ...f,
      lineup: f.lineup.map((a, i) => (i === idx ? { ...a, [key]: value } : a)),
    }));
  }
  function removeArtist(idx) {
    setForm((f) => ({ ...f, lineup: f.lineup.filter((_, i) => i !== idx) }));
  }
  /** Reorder — slot #1 is fixed; the rest can move up/down. */
  function moveArtist(idx, dir) {
    setForm((f) => {
      const next = [...f.lineup];
      const to = idx + dir;
      if (idx < 1 || to < 1 || to >= next.length) return f;
      [next[idx], next[to]] = [next[to], next[idx]];
      return { ...f, lineup: next };
    });
  }

  function buildLineup() {
    return form.lineup
      .map((a) => {
        const name = (a.name || '').trim();
        const socials = {};
        if (a.instagram.trim()) socials.instagram = a.instagram.trim();
        if (a.facebook.trim()) socials.facebook = a.facebook.trim();
        if (a.tiktok.trim()) socials.tiktok = a.tiktok.trim();
        return { name, ...(Object.keys(socials).length ? { socials } : {}) };
      })
      .filter((a) => a.name);
  }

  function buildSocials() {
    const s = {};
    if (form.instagram.trim()) s.instagram = form.instagram.trim();
    if (form.facebook.trim()) s.facebook = form.facebook.trim();
    if (form.tiktok.trim()) s.tiktok = form.tiktok.trim();
    return Object.keys(s).length ? s : undefined;
  }
  function validUrl(u) {
    const v = (u || '').trim();
    return /^https?:\/\/.+/i.test(v) ? v : undefined;
  }

  /* ---------- tickets ---------- */
  function addTicket() {
    setForm((f) => ({ ...f, tickets: [...f.tickets, { name: '', price: '', free: false }] }));
  }
  function updateTicket(idx, key, value) {
    setForm((f) => ({
      ...f,
      tickets: f.tickets.map((t, i) => (i === idx ? { ...t, [key]: value } : t)),
    }));
  }
  /** "Free entry" — a free ticket and an unpriced one must not look the same. */
  function toggleFreeTicket(idx) {
    setForm((f) => ({
      ...f,
      tickets: f.tickets.map((t, i) =>
        i === idx ? { ...t, free: !t.free, price: !t.free ? '' : t.price } : t,
      ),
    }));
  }
  function removeTicket(idx) {
    setForm((f) => ({ ...f, tickets: f.tickets.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit() {
    if (saving) return;
    if (!form.title.trim()) {
      alert.error('Missing title', 'Please enter an event title.');
      return;
    }
    // Venue is optional — many events are announced before the venue is
    // confirmed. Guests see "Venue revealed soon" until it is filled in.
    // City is not: it is what guests filter and search on, and the API
    // rejects an empty one, so ask for it rather than guessing a default.
    if (!form.city.trim()) {
      alert.error('Add the city', 'Type the city your event is in so guests can find it.');
      return;
    }
    if (!datePicked) {
      alert.error('Pick the event date', 'Choose the day your event happens under Date & time.');
      return;
    }

    // Start time is optional. With none picked the event is "day only": we
    // store noon (a neutral hour that can't drift into another day in any
    // timezone, so calendars group it correctly) and end of day (so it never
    // reads as "ended" while the day is still running). `startTimeTba` tells
    // the guest side to show "Time revealed soon" instead of that hour.
    const timeTba = !timePicked;
    const startsAt = timeTba
      ? new Date(form.year, form.monthIdx, dayClamped, 12, 0, 0, 0)
      : new Date(form.year, form.monthIdx, dayClamped, form.startH, form.startM || 0, 0, 0);

    let endsAt;
    if (timeTba) {
      endsAt = new Date(form.year, form.monthIdx, dayClamped, 23, 59, 0, 0);
    } else {
      // No end time picked → run for the default duration rather than
      // stamping a fixed hour on every event.
      endsAt =
        form.endH == null
          ? new Date(startsAt.getTime() + DEFAULT_DURATION_H * 3600 * 1000)
          : new Date(form.year, form.monthIdx, dayClamped, form.endH, form.endM || 0, 0, 0);
      // Ends past midnight → next day.
      if (endsAt <= startsAt) endsAt = new Date(endsAt.getTime() + 24 * 3600 * 1000);
    }

    // "Already over" is the honest check — an event whose day is still
    // running can be published even if its (unknown) time may have passed.
    if (!editing && endsAt.getTime() < Date.now()) {
      alert.error('That date has passed', 'Pick a date in the future for a new event.');
      return;
    }

    // Prices are optional: "Free entry" ticks explicitly free, an empty price
    // shows guests "Coming soon" until the organizer sets it.
    const ticketTypes = form.tickets
      .map((t) => {
        const trimmedName = t.name.trim();
        const cleanPrice = t.free ? '' : (t.price || '').toString().replace(/[,\s]/g, '');
        const priceNum = cleanPrice ? parseFloat(cleanPrice) : 0;
        return {
          name: trimmedName,
          priceLabel: t.free ? 'Free' : cleanPrice ? `LKR ${cleanPrice}` : PRICE_TBA,
          priceCents: !t.free && Number.isFinite(priceNum) ? Math.round(priceNum * 100) : 0,
          currency: 'LKR',
          // Quantity is no longer collected — sales are on the third-party
          // platform; capacity is a display-only high default.
          total: 10000,
        };
      })
      .filter((t) => t.name);

    const banner = validUrl(form.bannerUrl);
    const ticketUrl = validUrl(form.ticketUrl);
    const socials = buildSocials();
    const lineupArtists = buildLineup();

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      coverColor: COVER_COLORS[coverIdx] || '#1a0a2e',
      ...(banner ? { bannerImageUrl: banner, flyers: [banner] } : {}),
      ...(ticketUrl ? { ticketUrl } : {}),
      ...(socials ? { socials } : {}),
      lineup: lineupArtists,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      startTimeTba: timeTba,
      // Empty venue is allowed — the guest side shows "Venue revealed soon".
      venueName: form.venue.trim(),
      // No silent fallback — an empty city is caught in handleSubmit above
      // rather than quietly saved as somewhere the event isn't.
      cityName: form.city.trim(),
      ageRestriction: form.age,
      ticketTypes,
    };

    setSaving(true);
    try {
      if (editing) {
        const updated = await eventsRepo.update(event.id, payload);
        if (onSubmit) onSubmit(updated);
        alert.success('Event updated', `"${payload.title}" has been updated.`);
      } else {
        const newEvent = await eventsRepo.create({
          ...payload,
          addressLine: '',
          status: approval === 'Auto-publish' ? 'published' : 'draft',
        });
        if (onSubmit) onSubmit(newEvent);
        alert.success('Event published', `"${newEvent.title}" is live on the customer calendar.`);
      }
    } catch (e) {
      alert.error(editing ? 'Could not save' : 'Could not publish', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
      <ScreenHeader
        title={editing ? 'Edit Event' : 'New Event'}
        subtitle={editing ? event.title : 'Step 1 of 1'}
        onBack={onBack}
        rightLabel={editing ? undefined : 'Save draft'}
        onRightPress={
          editing
            ? undefined
            : () => {
                if (!form.title.trim()) {
                  alert.error('Add a title first', 'Drafts need at least a title to save.');
                  return;
                }
                alert.success('Draft saved', 'You can finish this event later from My Events → Drafts.');
              }
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Event flyer — upload a photo from the gallery or capture one.
            This is the image guests see on the Timeline and event page.
            Square preview showing the WHOLE flyer, same as guests see it. */}
        <Text style={styles.sectionLabel}>Event flyer</Text>
        <View style={styles.bannerWrap}>
          {flyerPreview || form.bannerUrl ? (
            <SquareFlyer uri={flyerPreview || form.bannerUrl} style={styles.bannerBg} />
          ) : (
            <LinearGradient
              colors={COVER_GRADIENTS[coverIdx]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerBg}
            />
          )}
          <View style={[styles.bannerOverlay, (flyerPreview || form.bannerUrl) && styles.bannerOverlayClear]}>
            {flyerUploading ? (
              <View style={styles.progressWrap}>
                {/* Fixed-width track that clips the fill: whatever value
                    comes in, the bar can never grow past its container. */}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${flyerPct}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {flyerPct >= 99 ? 'Finishing upload…' : `Uploading… ${flyerPct}%`}
                </Text>
              </View>
            ) : null}
            {/* The title/date preview only shows on the gradient placeholder —
                an uploaded flyer already carries its own artwork. */}
            {!(flyerPreview || form.bannerUrl) ? (
              <>
                <Text style={styles.bannerTitle} numberOfLines={2}>
                  {form.title || 'Your event title'}
                </Text>
                <Text style={styles.bannerSub}>
                  {[form.city, datePicked ? dateLabel : null, timePicked ? startLabel : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Flyer actions — big, obvious buttons (clients could not find the
            upload before when it was a bare URL field). */}
        <View style={styles.flyerBtns}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.flyerBtn}
            disabled={flyerUploading}
            onPress={() => pickFlyer(false)}
          >
            <Ionicons name="images-outline" size={18} color={COLORS.accent} />
            <Text style={styles.flyerBtnText}>Upload flyer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.flyerBtn}
            disabled={flyerUploading}
            onPress={() => pickFlyer(true)}
          >
            <Ionicons name="camera-outline" size={18} color={COLORS.accent} />
            <Text style={styles.flyerBtnText}>Take photo</Text>
          </TouchableOpacity>
          {flyerPreview || form.bannerUrl ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.flyerBtnRemove}
              disabled={flyerUploading}
              onPress={removeFlyer}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stripBar} contentContainerStyle={styles.coverStrip}>
          {COVER_GRADIENTS.map((g, idx) => {
            const active = idx === coverIdx;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.85}
                onPress={() => setCoverIdx(idx)}
                style={[styles.coverTile, active && styles.coverTileActive]}
              >
                <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Basic */}
        <Text style={styles.sectionLabel}>Event details</Text>
        <View style={styles.card}>
          <Field label="Title" value={form.title} onChange={(v) => set('title', v)} placeholder="Add your event title" />
          <Field
            label="Description"
            value={form.description}
            onChange={(v) => set('description', v)}
            placeholder="What's happening, who's playing, what to expect…"
            multiline
          />
        </View>

        {/* Category — preset selection */}
        <Text style={styles.sectionLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stripBar} contentContainerStyle={styles.chipsRowScroll}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              active={form.category === c}
              onPress={() => set('category', c)}
              style={{ marginRight: SPACING.sm }}
            />
          ))}
        </ScrollView>

        {/* Age — sits directly under Category; both describe what the event
            *is*, so they are answered together before date and place. */}
        <Text style={styles.sectionLabel}>Age restriction</Text>
        <View style={styles.chipsRow}>
          {AGES.map((a) => (
            <Chip
              key={a}
              label={a}
              active={form.age === a}
              onPress={() => set('age', a)}
              style={{ marginRight: SPACING.sm }}
            />
          ))}
        </View>

        {/* Date & time — selection, no typing. Nothing is pre-picked: the
            manager chooses the day and the start time, and both stay
            editable after the event is published. */}
        <Text style={styles.sectionLabel}>Date & time</Text>
        <View style={styles.card}>
          <View style={styles.summaryCard}>
            <SummaryLine
              icon="calendar-outline"
              label="Date"
              value={dateLabel}
              pending={!datePicked}
            />
            <SummaryLine
              icon="time-outline"
              label="Starts"
              value={startLabel}
              pending={!timePicked}
            />
            <SummaryLine
              icon="hourglass-outline"
              label="Ends"
              value={endLabel}
              pending={!timePicked}
            />
          </View>

          <PickRow
            label="Year"
            options={[...new Set([new Date().getFullYear(), new Date().getFullYear() + 1, form.year])].sort()}
            value={form.year}
            format={String}
            onPick={(v) => set('year', v)}
          />
          <PickRow
            label="Month"
            options={MONTHS.map((_, i) => i)}
            value={form.monthIdx}
            format={(i) => MONTHS[i]}
            onPick={(v) => set('monthIdx', v)}
          />
          <PickRow
            label="Day (required)"
            options={Array.from({ length: maxDay }, (_, i) => i + 1)}
            value={dayClamped}
            format={String}
            onPick={(v) => set('day', v)}
          />
          {/* Start & end minutes are picked separately (they used to share
              one selector, which forced the same minutes on both). */}
          <PickRow
            label="Start time (optional)"
            options={HOURS}
            value={form.startH}
            format={fmtHour}
            onPick={(v) => set('startH', v)}
            onClear={timePicked ? () => setForm((f) => ({ ...f, startH: null, startM: null, endH: null, endM: null })) : undefined}
          />
          {/* Minutes and the end time only mean something once a start hour
              exists — until then the whole event is simply "that day". */}
          {timePicked ? (
            <>
              <PickRow
                label="Start minutes"
                options={minuteOptions(form.startM)}
                value={form.startM}
                format={(m) => `:${String(m).padStart(2, '0')}`}
                onPick={(v) => set('startM', v)}
              />
              <PickRow
                label="End time (optional)"
                options={HOURS}
                value={form.endH}
                format={fmtHour}
                onPick={(v) => set('endH', v)}
                onClear={form.endH != null ? () => setForm((f) => ({ ...f, endH: null, endM: null })) : undefined}
              />
              {form.endH != null ? (
                <PickRow
                  label="End minutes"
                  options={minuteOptions(form.endM)}
                  value={form.endM}
                  format={(m) => `:${String(m).padStart(2, '0')}`}
                  onPick={(v) => set('endM', v)}
                />
              ) : null}
            </>
          ) : null}
          <View style={styles.hintRow}>
            <Ionicons name="sparkles-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.hintText}>
              Only the day is required — nothing is filled in for you. Skip the start time and
              guests see “{TEASER.time}” until you announce it. Pick a start time but no end time
              and the event runs {DEFAULT_DURATION_H} hours. All of it stays editable from
              My Events → Edit.
            </Text>
          </View>
        </View>

        {/* Venue — optional; announce first, confirm the venue later */}
        <Text style={styles.sectionLabel}>Venue</Text>
        <View style={styles.card}>
          <Field
            icon="location-outline"
            label="Venue name (optional)"
            value={form.venue}
            onChange={(v) => set('venue', v)}
            placeholder="Leave empty to keep it a secret"
          />
          {/* "e.g." keeps the hint reading as a hint — a bare "Colombo" was
              mistaken for a filled-in value that had to be cleared. */}
          <Field
            icon="map-outline"
            label="City"
            value={form.city}
            onChange={(v) => set('city', v)}
            placeholder="e.g. Colombo"
          />
          <View style={styles.hintRow}>
            <Ionicons name="sparkles-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.hintText}>
              No venue yet? Guests see “Venue revealed soon” until you add it — perfect for a
              surprise location. The city is still needed so they can find it.
            </Text>
          </View>
        </View>

        {/* Ticketing link — powers the guest "Buy Now" jump */}
        <Text style={styles.sectionLabel}>Ticketing</Text>
        <View style={styles.card}>
          <Field
            icon="link-outline"
            label="Third-party ticketing link"
            value={form.ticketUrl}
            onChange={(v) => set('ticketUrl', v)}
            placeholder="https://… (Buy Now opens this page)"
          />
          <View style={styles.hintRow}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.hintText}>
              Guests tap Buy Now and go straight to this page. Ticket types below are shown for information only.
            </Text>
          </View>
        </View>

        {/* Ticket types — name + price only (no quantity) */}
        <Text style={styles.sectionLabel}>Ticket types</Text>
        <View style={{ paddingHorizontal: SPACING.base }}>
          {form.tickets.map((t, idx) => (
            <View key={idx} style={styles.ticketCard}>
              <View style={styles.ticketHead}>
                <View style={styles.ticketBadge}>
                  <Text style={styles.ticketBadgeText}>#{idx + 1}</Text>
                </View>
                {form.tickets.length > 1 ? (
                  <TouchableOpacity onPress={() => removeTicket(idx)} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.fieldRow}>
                <View style={{ flex: 1.4 }}>
                  <Field
                    label="Type name"
                    value={t.name}
                    onChange={(v) => updateTicket(idx, 'name', v)}
                    placeholder="e.g. General Admission"
                  />
                </View>
                <View style={{ width: SPACING.sm }} />
                <View style={{ flex: 1 }}>
                  <Field
                    label="Price (LKR)"
                    value={t.free ? '' : t.price}
                    // Digits only — a stray letter would ship as "LKR abc" on
                    // the guest page.
                    onChange={(v) => updateTicket(idx, 'price', v.replace(/[^0-9.]/g, ''))}
                    placeholder={t.free ? 'Free entry' : 'Leave empty'}
                    editable={!t.free}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <View style={styles.ticketFoot}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => toggleFreeTicket(idx)}
                  style={[styles.freeChip, t.free && styles.freeChipOn]}
                >
                  <Ionicons
                    name={t.free ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={t.free ? '#000' : COLORS.textMuted}
                  />
                  <Text style={[styles.freeChipText, t.free && styles.freeChipTextOn]}>Free entry</Text>
                </TouchableOpacity>
                <Text style={styles.pricePreview} numberOfLines={1}>
                  Guests see:{' '}
                  <Text style={styles.pricePreviewValue}>
                    {t.free ? 'Free' : t.price.trim() ? `LKR ${t.price.trim()}` : PRICE_TBA}
                  </Text>
                </Text>
              </View>
            </View>
          ))}
          <TouchableOpacity activeOpacity={0.8} onPress={addTicket} style={styles.addTicket}>
            <Ionicons name="add-circle-outline" size={18} color={COLORS.accent} />
            <Text style={styles.addTicketText}>Add another ticket type</Text>
          </TouchableOpacity>
          <View style={[styles.hintRow, { marginTop: SPACING.sm }]}>
            <Ionicons name="sparkles-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.hintText}>
              Prices are optional. Leave one empty and guests see “{PRICE_TBA}” until you set it —
              leave the whole section blank and they see “Ticket details coming soon”.
            </Text>
          </View>
        </View>

        {/* Line up — reorderable; slot #1 is fixed, order carries the billing */}
        <Text style={styles.sectionLabel}>Line up</Text>
        <View style={{ paddingHorizontal: SPACING.base }}>
          {form.lineup.map((a, idx) => (
            <View key={idx} style={styles.ticketCard}>
              <View style={styles.ticketHead}>
                <View style={styles.ticketBadge}>
                  {/* No "HEADLINER" on slot #1 — every slot is just an artist
                      number (client feedback 2026-07-09, repeated 07-26). */}
                  <Text style={styles.ticketBadgeText}>{`ARTIST #${idx + 1}`}</Text>
                </View>
                <View style={styles.rowActions}>
                  {idx > 1 ? (
                    <TouchableOpacity onPress={() => moveArtist(idx, -1)} activeOpacity={0.7} style={styles.moveBtn}>
                      <Ionicons name="chevron-up" size={15} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  ) : null}
                  {idx >= 1 && idx < form.lineup.length - 1 ? (
                    <TouchableOpacity onPress={() => moveArtist(idx, 1)} activeOpacity={0.7} style={styles.moveBtn}>
                      <Ionicons name="chevron-down" size={15} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  ) : null}
                  {form.lineup.length > 1 ? (
                    <TouchableOpacity onPress={() => removeArtist(idx)} activeOpacity={0.7} style={styles.moveBtn}>
                      <Ionicons name="trash-outline" size={15} color={COLORS.error} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
              <Field
                label="Add Artist Name"
                value={a.name}
                onChange={(v) => updateArtist(idx, 'name', v)}
                placeholder="e.g. Bathiya & Santhush"
              />
              {a.name.trim() === REVEALED_SOON ? (
                <View style={styles.hintRow}>
                  <Ionicons name="sparkles-outline" size={14} color={COLORS.accent} />
                  <Text style={styles.hintText}>
                    Shown as a surprise slot — edit this event after publishing to reveal the artist.
                  </Text>
                </View>
              ) : (
                <>
                  <Field
                    icon="logo-instagram"
                    label="Instagram"
                    value={a.instagram}
                    onChange={(v) => updateArtist(idx, 'instagram', v)}
                    placeholder="https://instagram.com/…"
                  />
                  <Field
                    icon="logo-facebook"
                    label="Facebook"
                    value={a.facebook}
                    onChange={(v) => updateArtist(idx, 'facebook', v)}
                    placeholder="https://facebook.com/…"
                  />
                  <Field
                    icon="logo-tiktok"
                    label="TikTok"
                    value={a.tiktok}
                    onChange={(v) => updateArtist(idx, 'tiktok', v)}
                    placeholder="https://tiktok.com/@…"
                  />
                </>
              )}
            </View>
          ))}
          <View style={styles.lineupBtns}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => addArtist()} style={[styles.addTicket, { flex: 1 }]}>
              <Ionicons name="add-circle-outline" size={18} color={COLORS.accent} />
              <Text style={styles.addTicketText}>Add artist</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => addArtist(REVEALED_SOON)} style={[styles.addTicket, { flex: 1 }]}>
              <Ionicons name="sparkles-outline" size={16} color={COLORS.accent} />
              <Text style={styles.addTicketText}>Revealed Soon</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promotion & socials */}
        <Text style={styles.sectionLabel}>Promotion & socials</Text>
        <View style={styles.card}>
          <Field
            icon="image-outline"
            label="Flyer image URL (or use Upload flyer above)"
            value={form.bannerUrl}
            onChange={(v) => set('bannerUrl', v)}
            placeholder="https://… (auto-filled when you upload a flyer)"
          />
          <Field icon="logo-facebook" label="Facebook page" value={form.facebook} onChange={(v) => set('facebook', v)} placeholder="https://facebook.com/…" />
          <Field icon="logo-instagram" label="Instagram" value={form.instagram} onChange={(v) => set('instagram', v)} placeholder="https://instagram.com/…" />
          <Field icon="logo-tiktok" label="TikTok" value={form.tiktok} onChange={(v) => set('tiktok', v)} placeholder="https://tiktok.com/@…" />
        </View>

        {/* Approval mode — create only. The refund/cancellation policy block
            was removed entirely (client feedback 2026-08-10): ticketing and
            its policies live on the third-party platform. */}
        {!editing ? (
          <>
            <Text style={styles.sectionLabel}>Approval mode</Text>
            <View style={styles.chipsRow}>
              {APPROVAL_MODES.map((m) => (
                <Chip
                  key={m}
                  label={m}
                  active={approval === m}
                  onPress={() => setApproval(m)}
                  style={{ marginRight: SPACING.sm }}
                />
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.helperCard}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.helperText}>
            {editing
              ? 'Changes go live immediately — surprise artists and price updates show on the guest page right away.'
              : 'Once published, fans can follow your company and jump to your ticketing page. You can edit the event (reveal artists, adjust prices) any time.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={saving ? 'Saving…' : editing ? 'Save changes' : 'Publish event'}
          variant="primary"
          disabled={saving}
          loading={saving}
          onPress={handleSubmit}
          style={styles.publishBtn}
        />
      </View>
    </View>
  );
}

/** One line of the date/time summary — reads "Not selected yet" until picked. */
function SummaryLine({ icon, label, value, pending }) {
  return (
    <View style={styles.summaryLine}>
      <Ionicons name={icon} size={14} color={pending ? COLORS.textMuted : COLORS.accent} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, pending && styles.summaryValuePending]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

SummaryLine.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
  pending: PropTypes.bool,
};

/**
 * Horizontal chip row picker — the "selection instead of typing" control.
 * `onClear` adds a "Clear" affordance so an optional pick (the start time)
 * can be taken back to "to be announced" once chosen.
 */
function PickRow({ label, options, value, format, onPick, onClear }) {
  return (
    <View style={styles.pickRow}>
      <View style={styles.pickHead}>
        <Text style={styles.pickLabel}>{label}</Text>
        {onClear ? (
          <TouchableOpacity onPress={onClear} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.pickClear}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stripBar} contentContainerStyle={styles.pickStrip}>
        {options.map((opt) => {
          const active = opt === value;
          return (
            <TouchableOpacity
              key={String(opt)}
              onPress={() => onPick(opt)}
              activeOpacity={0.8}
              style={[styles.pickChip, active && styles.pickChipActive]}
            >
              <Text style={[styles.pickChipText, active && styles.pickChipTextActive]}>
                {format(opt)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

PickRow.propTypes = {
  label: PropTypes.string,
  options: PropTypes.array,
  value: PropTypes.any,
  format: PropTypes.func,
  onPick: PropTypes.func,
  onClear: PropTypes.func,
};

function Field({ icon, label, value, onChange, placeholder, multiline, editable = true, keyboardType }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.fieldInputWrap,
          multiline && styles.fieldInputWrapMulti,
          !editable && styles.fieldInputWrapOff,
        ]}
      >
        {icon ? <Ionicons name={icon} size={14} color={COLORS.textMuted} style={{ marginRight: 6 }} /> : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          multiline={multiline}
          editable={editable}
          keyboardType={keyboardType}
          style={[styles.fieldInput, multiline && { minHeight: 88, textAlignVertical: 'top' }]}
        />
      </View>
    </View>
  );
}

Field.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  multiline: PropTypes.bool,
  editable: PropTypes.bool,
  keyboardType: PropTypes.string,
};

EventCreatorScreen.propTypes = {
  onBack: PropTypes.func,
  onSubmit: PropTypes.func,
  event: PropTypes.object,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  sectionLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  stripBar: { flexGrow: 0 },
  // Square, like the flyer itself — the whole artwork fits (no crop).
  bannerWrap: {
    aspectRatio: 1,
    marginHorizontal: SPACING.base,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  bannerBg: { ...StyleSheet.absoluteFillObject },
  bannerOverlay: {
    flex: 1,
    padding: SPACING.base,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  // No wash over a real flyer — the preview must match what guests see.
  bannerOverlayClear: { backgroundColor: 'transparent' },
  bannerTitle: {
    ...TYPE_SCALE.h3,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: '#000',
  },
  bannerSub: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: 'rgba(0,0,0,0.75)',
    marginTop: 4,
  },
  coverStrip: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  flyerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
  },
  flyerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,59,59,0.5)',
    backgroundColor: 'rgba(255,59,59,0.08)',
  },
  flyerBtnText: { fontSize: 13, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.accent },
  flyerBtnRemove: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    backgroundColor: COLORS.surface1,
  },
  progressWrap: {
    marginBottom: SPACING.sm,
    gap: 4,
  },
  progressTrack: {
    alignSelf: 'stretch',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  progressText: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: '#fff',
  },
  coverTile: {
    width: 76,
    height: 56,
    borderRadius: RADII.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coverTileActive: { borderColor: COLORS.accent },

  card: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.base,
  },
  field: { marginBottom: SPACING.sm },
  fieldLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface2,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    minHeight: 44,
  },
  fieldInputWrapMulti: {
    alignItems: 'flex-start',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  fieldInputWrapOff: { opacity: 0.5 },
  fieldInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY.body,
    fontSize: 14,
    paddingVertical: 0,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  chipsRowScroll: {
    paddingHorizontal: SPACING.base,
    alignItems: 'center',
  },

  /* date & time selection */
  summaryCard: {
    gap: SPACING.sm,
    padding: SPACING.md,
    marginBottom: SPACING.base,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  summaryLine: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  summaryLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    width: 52,
  },
  summaryValue: {
    flex: 1,
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  summaryValuePending: {
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
  },
  pickRow: { marginBottom: SPACING.sm },
  pickHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pickLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  pickClear: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
  },
  pickStrip: { gap: 6, paddingRight: SPACING.base },
  pickChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  pickChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  pickChipText: { fontSize: 12, fontFamily: FONT_FAMILY.bodyMedium, color: COLORS.textSecondary },
  pickChipTextActive: { color: '#000', fontFamily: FONT_FAMILY.bodyBold },

  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  hintText: {
    flex: 1,
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    lineHeight: 16,
  },

  ticketCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  ticketHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  ticketBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,59,59,0.14)',
    borderColor: COLORS.accent,
    borderWidth: 1,
    borderRadius: RADII.pill,
  },
  ticketBadgeText: { fontSize: 10, fontFamily: FONT_FAMILY.bodyBold, color: COLORS.accent, letterSpacing: 0.5 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  moveBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  addTicket: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,59,59,0.45)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,59,59,0.05)',
  },
  addTicketText: { fontSize: 13, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.accent },
  lineupBtns: { flexDirection: 'row', gap: SPACING.sm },

  /* ticket price row */
  ticketFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: 2,
  },
  freeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    backgroundColor: COLORS.surface2,
  },
  freeChipOn: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  freeChipText: { fontSize: 12, fontFamily: FONT_FAMILY.bodyMedium, color: COLORS.textSecondary },
  freeChipTextOn: { color: '#000', fontFamily: FONT_FAMILY.bodyBold },
  pricePreview: {
    flexShrink: 1,
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  pricePreviewValue: { fontFamily: FONT_FAMILY.bodyBold, color: COLORS.textSecondary },

  helperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  helperText: {
    flex: 1,
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  footer: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSubtle,
    backgroundColor: 'rgba(5,5,5,0.96)',
  },
  publishBtn: { height: 50 },
});
