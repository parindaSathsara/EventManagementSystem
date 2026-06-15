import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import Avatar from '../../../shared/components/Avatar';
import SocialRow from './SocialRow';

/**
 * Bottom sheet shown when a lineup artist or an event manager is tapped — never
 * a full page. Shows the name/photo, their socials (FB/IG/TikTok), and a list of
 * related events ("also playing" for artists, "more events" for managers).
 */
export default function ProfileSheet({
  visible,
  name,
  subtitle,
  avatarUrl,
  socials,
  relatedEvents = [],
  onClose,
  onOpenEvent,
}) {
  const hasSocials = socials && (socials.facebook || socials.instagram || socials.tiktok);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />

        <View style={styles.head}>
          <Avatar uri={avatarUrl} name={name} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {hasSocials ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Social media</Text>
            <SocialRow socials={socials} size={20} />
          </View>
        ) : (
          <Text style={styles.noSocial}>No social links added.</Text>
        )}

        {relatedEvents.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {relatedEvents.length === 1 ? '1 event' : `${relatedEvents.length} events`}
            </Text>
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {relatedEvents.map((ev) => {
                const d = new Date(ev.startsAt);
                return (
                  <TouchableOpacity
                    key={ev.id}
                    style={styles.eventRow}
                    activeOpacity={0.8}
                    onPress={() => {
                      onClose && onClose();
                      onOpenEvent && onOpenEvent(ev.id);
                    }}
                  >
                    <View style={styles.dateChip}>
                      <Text style={styles.dateChipDay}>{d.getDate()}</Text>
                      <Text style={styles.dateChipMonth}>
                        {d.toLocaleString('en', { month: 'short' }).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                      <Text style={styles.eventMeta} numberOfLines={1}>
                        {ev.venueName}{ev.cityName ? ` · ${ev.cityName}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={{ height: SPACING.xl }} />
      </View>
    </Modal>
  );
}

ProfileSheet.propTypes = {
  visible: PropTypes.bool,
  name: PropTypes.string,
  subtitle: PropTypes.string,
  avatarUrl: PropTypes.string,
  socials: PropTypes.object,
  relatedEvents: PropTypes.array,
  onClose: PropTypes.func,
  onOpenEvent: PropTypes.func,
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: COLORS.bgStrong,
    borderTopLeftRadius: RADII.xl || 24,
    borderTopRightRadius: RADII.xl || 24,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lineSubtle,
    marginBottom: SPACING.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  name: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.accent,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface1,
  },
  section: { marginTop: SPACING.lg, gap: SPACING.sm },
  sectionLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  noSocial: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.lg,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
  },
  dateChip: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.sm,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    minWidth: 44,
  },
  dateChipDay: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  dateChipMonth: {
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
  },
  eventTitle: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  eventMeta: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
