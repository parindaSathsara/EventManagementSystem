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
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import {
  Button,
  Chip,
  ScreenHeader,
} from '../../../shared/components';
import { useAlert } from '../../../shared/hooks';
import { eventsRepo } from '../../../services';

const COVER_COLORS = ['#260b3d', '#0a2a1a', '#3d1a0b', '#0d1b2a', '#5BFFC2'];

function parseDateTime(dateStr, timeStr) {
  // Parses "Fri, 30 May 2026" + "20:00" into an ISO string.
  // Best-effort — falls back to current time + 1 day if parsing fails.
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime()) && timeStr) {
      const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
      d.setHours(h || 20, m || 0, 0, 0);
      return d.toISOString();
    }
  } catch (_e) {} // eslint-disable-line no-empty
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 1);
  return fallback.toISOString();
}

const CATEGORIES = ['Concert', 'Festival', 'Party', 'Live Set', 'Experience'];
const AGES = ['All ages', '13+', '18+', '21+'];
const APPROVAL_MODES = ['Auto-publish', 'Submit for review'];

const COVER_GRADIENTS = [
  ['#FF5482', '#260b3d'],
  ['#00FFA1', '#0a2a1a'],
  ['#FFB020', '#3d1a0b'],
  ['#6BA8FF', '#0d1b2a'],
  ['#FF7DA1', '#5BFFC2'],
];

export default function EventCreatorScreen({ onBack, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Concert');
  const [date, setDate] = useState('Fri, 30 May 2026');
  const [start, setStart] = useState('20:00');
  const [end, setEnd] = useState('23:30');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('Colombo');
  const [age, setAge] = useState('18+');
  const [coverIdx, setCoverIdx] = useState(0);
  const [tickets, setTickets] = useState([
    { name: 'General Admission', price: '4500', remaining: '500' },
  ]);
  const [approval, setApproval] = useState('Auto-publish');
  const [refundable, setRefundable] = useState(true);
  // Promotion: a banner/flyer image URL (the booking CTA) + company socials.
  const [bannerUrl, setBannerUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const alert = useAlert();

  function buildSocials() {
    const s = {};
    if (instagram.trim()) s.instagram = instagram.trim();
    if (facebook.trim()) s.facebook = facebook.trim();
    if (tiktok.trim()) s.tiktok = tiktok.trim();
    return Object.keys(s).length ? s : undefined;
  }
  function validBanner() {
    const u = bannerUrl.trim();
    return /^https?:\/\/.+/i.test(u) ? u : undefined;
  }

  async function handlePublish() {
    if (!title.trim()) {
      alert.error('Missing title', 'Please enter an event title.');
      return;
    }
    if (!venue.trim()) {
      alert.error('Missing venue', 'Please enter a venue name.');
      return;
    }
    const startsAt = parseDateTime(date, start);
    const endsAt = parseDateTime(date, end);
    // The backend infers the organizer from the JWT and assigns a
    // ticketTypeId on each entry; we just describe what the user typed.
    // Drop ticket rows that are blank or have zero capacity — the backend
    // rejects `total: 0`, so let the user fix it at the source instead of
    // surfacing a confusing 400.
    const ticketTypes = tickets
      .map((t) => {
        const trimmedName = t.name.trim();
        const totalNum = parseInt(t.remaining, 10);
        const cleanPrice = (t.price || '').toString().replace(/[,\s]/g, '');
        const priceNum = cleanPrice ? parseFloat(cleanPrice) : 0;
        return {
          name: trimmedName,
          priceLabel: cleanPrice ? `LKR ${cleanPrice}` : 'Free',
          priceCents: Number.isFinite(priceNum) ? Math.round(priceNum * 100) : 0,
          currency: 'LKR',
          total: Number.isFinite(totalNum) ? totalNum : 0,
        };
      })
      .filter((t) => t.name && t.total > 0);

    if (ticketTypes.length === 0) {
      alert.error('Add at least one ticket', 'Each ticket needs a name and a capacity above zero.');
      return;
    }

    try {
      const banner = validBanner();
      const socials = buildSocials();
      const newEvent = await eventsRepo.create({
        title: title.trim(),
        description: description.trim(),
        category,
        coverColor: COVER_COLORS[coverIdx] || '#1a0a2e',
        ...(banner ? { bannerImageUrl: banner, flyers: [banner] } : {}),
        ...(socials ? { socials } : {}),
        startsAt,
        endsAt,
        venueName: venue.trim(),
        cityName: city.trim() || 'Colombo',
        addressLine: '',
        ageRestriction: age,
        cancellationPolicy: refundable
          ? 'Refunds available up to 24h before event start.'
          : 'Non-refundable.',
        ticketTypes,
        // The organizer (this manager, acting as the artist) is auto-linked to
        // the event's lineup by the backend when no explicit lineup is given.
        // Backend rejects unknown statuses; 'pending' is not in the enum.
        status: approval === 'Auto-publish' ? 'published' : 'draft',
      });
      if (onSubmit) onSubmit(newEvent);
      alert.success('Event published', `"${newEvent.title}" is live on the customer calendar.`);
    } catch (e) {
      alert.error('Could not publish', e?.message || 'Please try again.');
    }
  }

  function addTicket() {
    setTickets((prev) => [...prev, { name: '', price: '', remaining: '' }]);
  }
  function updateTicket(idx, key, value) {
    setTickets((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [key]: value } : t)),
    );
  }
  function removeTicket(idx) {
    setTickets((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
      <ScreenHeader
        title="New Event"
        subtitle="Step 1 of 1"
        onBack={onBack}
        rightLabel="Save draft"
        onRightPress={() => {
          if (!title.trim()) {
            alert.error('Add a title first', 'Drafts need at least a title to save.');
            return;
          }
          alert.success('Draft saved', 'You can finish this event later from My Events → Drafts.');
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Banner picker */}
        <Text style={styles.sectionLabel}>Banner</Text>
        <View style={styles.bannerWrap}>
          <LinearGradient
            colors={COVER_GRADIENTS[coverIdx]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerBg}
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle} numberOfLines={2}>
              {title || 'Your event title'}
            </Text>
            <Text style={styles.bannerSub}>
              {city} · {date} · {start}
            </Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.coverStrip}>
          <TouchableOpacity activeOpacity={0.85} style={styles.uploadTile}>
            <Ionicons name="cloud-upload-outline" size={20} color={COLORS.accent} />
            <Text style={styles.uploadText}>Upload</Text>
          </TouchableOpacity>
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
          <Field label="Title" value={title} onChange={setTitle} placeholder="e.g. Vyanjan Album Launch" />
          <Field
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="What's happening, who's playing, what to expect…"
            multiline
          />
        </View>

        {/* Category */}
        <Text style={styles.sectionLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              active={category === c}
              onPress={() => setCategory(c)}
              style={{ marginRight: SPACING.sm }}
            />
          ))}
        </ScrollView>

        {/* Date / time */}
        <Text style={styles.sectionLabel}>Date & time</Text>
        <View style={styles.card}>
          <Field icon="calendar-outline" label="Date" value={date} onChange={setDate} />
          <View style={styles.fieldRow}>
            <View style={{ flex: 1 }}>
              <Field icon="time-outline" label="Start" value={start} onChange={setStart} />
            </View>
            <View style={{ width: SPACING.sm }} />
            <View style={{ flex: 1 }}>
              <Field icon="time-outline" label="End" value={end} onChange={setEnd} />
            </View>
          </View>
        </View>

        {/* Venue */}
        <Text style={styles.sectionLabel}>Venue</Text>
        <View style={styles.card}>
          <Field icon="location-outline" label="Venue name" value={venue} onChange={setVenue} placeholder="Stardust Arena" />
          <Field icon="map-outline" label="City" value={city} onChange={setCity} placeholder="Colombo" />
          <View style={styles.mapHint}>
            <Ionicons name="map" size={28} color={COLORS.textMuted} />
            <Text style={styles.mapHintText}>Pick a location on the map</Text>
            <TouchableOpacity activeOpacity={0.8} style={styles.mapBtn}>
              <Text style={styles.mapBtnText}>Set on map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Age */}
        <Text style={styles.sectionLabel}>Age restriction</Text>
        <View style={styles.chipsRow}>
          {AGES.map((a) => (
            <Chip
              key={a}
              label={a}
              active={age === a}
              onPress={() => setAge(a)}
              style={{ marginRight: SPACING.sm }}
            />
          ))}
        </View>

        {/* Tickets */}
        <Text style={styles.sectionLabel}>Tickets</Text>
        <View style={{ paddingHorizontal: SPACING.base }}>
          {tickets.map((t, idx) => (
            <View key={idx} style={styles.ticketCard}>
              <View style={styles.ticketHead}>
                <View style={styles.ticketBadge}>
                  <Text style={styles.ticketBadgeText}>#{idx + 1}</Text>
                </View>
                {tickets.length > 1 ? (
                  <TouchableOpacity onPress={() => removeTicket(idx)} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <Field
                label="Type name"
                value={t.name}
                onChange={(v) => updateTicket(idx, 'name', v)}
                placeholder="e.g. VIP Lounge"
              />
              <View style={styles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Price (LKR)"
                    value={t.price}
                    onChange={(v) => updateTicket(idx, 'price', v)}
                    placeholder="4500"
                  />
                </View>
                <View style={{ width: SPACING.sm }} />
                <View style={{ flex: 1 }}>
                  <Field
                    label="Quantity"
                    value={t.remaining}
                    onChange={(v) => updateTicket(idx, 'remaining', v)}
                    placeholder="500"
                  />
                </View>
              </View>
            </View>
          ))}
          <TouchableOpacity activeOpacity={0.8} onPress={addTicket} style={styles.addTicket}>
            <Ionicons name="add-circle-outline" size={18} color={COLORS.accent} />
            <Text style={styles.addTicketText}>Add another ticket type</Text>
          </TouchableOpacity>
        </View>

        {/* Promotion & socials */}
        <Text style={styles.sectionLabel}>Promotion & socials</Text>
        <View style={styles.card}>
          <Field
            icon="image-outline"
            label="Flyer / banner image URL"
            value={bannerUrl}
            onChange={setBannerUrl}
            placeholder="https://… (the booking CTA image)"
          />
          <Field icon="logo-instagram" label="Instagram" value={instagram} onChange={setInstagram} placeholder="https://instagram.com/…" />
          <Field icon="logo-facebook" label="Facebook" value={facebook} onChange={setFacebook} placeholder="https://facebook.com/…" />
          <Field icon="logo-tiktok" label="TikTok" value={tiktok} onChange={setTiktok} placeholder="https://tiktok.com/@…" />
        </View>

        {/* Policies */}
        <Text style={styles.sectionLabel}>Policies</Text>
        <View style={styles.card}>
          <View style={styles.policyRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.highlight} />
            <View style={{ flex: 1 }}>
              <Text style={styles.policyLabel}>Refundable</Text>
              <Text style={styles.policySub}>Customers can request refunds up to 24h before the event.</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setRefundable((r) => !r)} style={[styles.toggle, refundable && styles.toggleOn]}>
              <View style={[styles.toggleKnob, refundable && styles.toggleKnobOn]} />
            </TouchableOpacity>
          </View>
        </View>

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

        <View style={styles.helperCard}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.helperText}>
            Once published, fans can save and book this event. Major changes will be logged in the change history.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Publish event"
          variant="primary"
          onPress={handlePublish}
          style={styles.publishBtn}
        />
      </View>
    </View>
  );
}

function Field({ icon, label, value, onChange, placeholder, multiline }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldInputWrap, multiline && styles.fieldInputWrapMulti]}>
        {icon ? <Ionicons name={icon} size={14} color={COLORS.textMuted} style={{ marginRight: 6 }} /> : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          multiline={multiline}
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
};

EventCreatorScreen.propTypes = {
  onBack: PropTypes.func,
  onSubmit: PropTypes.func,
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
  bannerWrap: {
    height: 160,
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
  uploadTile: {
    width: 76,
    height: 56,
    borderRadius: RADII.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,84,130,0.45)',
    backgroundColor: 'rgba(255,84,130,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  uploadText: { fontSize: 10, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.accent },
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
  mapHint: {
    marginTop: SPACING.sm,
    height: 120,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mapHintText: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
  },
  mapBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  mapBtnText: { fontSize: 11, fontFamily: FONT_FAMILY.bodyBold, color: '#000' },

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
    backgroundColor: 'rgba(255,84,130,0.12)',
    borderColor: COLORS.accent,
    borderWidth: 1,
    borderRadius: RADII.pill,
  },
  ticketBadgeText: { fontSize: 10, fontFamily: FONT_FAMILY.bodyBold, color: COLORS.accent, letterSpacing: 0.5 },
  addTicket: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,84,130,0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,84,130,0.04)',
  },
  addTicketText: { fontSize: 13, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.accent },

  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  policyLabel: { ...TYPE_SCALE.bodyMd, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textPrimary },
  policySub: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surface3,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: COLORS.accent },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleKnobOn: { transform: [{ translateX: 18 }] },

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
