import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { searchPlaces, getPlaceDetails } from '../../../services/places';
import { useDebounce } from '../../../shared/hooks';

const RECENT = [
  { name: 'Colombo, Sri Lanka', shortName: 'Colombo', lat: 6.9271, lng: 79.8612 },
  { name: 'Galle, Sri Lanka', shortName: 'Galle', lat: 6.0535, lng: 80.221 },
  { name: 'Kandy, Sri Lanka', shortName: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { name: 'Negombo, Sri Lanka', shortName: 'Negombo', lat: 7.2083, lng: 79.8358 },
];

export default function LocationPickerSheet({ visible, current, onClose, onPick }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 280);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resolving, setResolving] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setPredictions([]);
      setError(null);
      return;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const q = debounced.trim();
    if (q.length < 2) {
      setPredictions([]);
      setError(null);
      setLoading(false);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    searchPlaces(q, { signal: controller.signal })
      .then((r) => { setPredictions(r); setLoading(false); })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setError(e.message || 'Search failed');
        setLoading(false);
      });
    return () => controller.abort();
  }, [debounced, visible]);

  async function handlePick(item) {
    if (item.id) {
      try {
        setResolving(true);
        const place = await getPlaceDetails(item.id);
        setResolving(false);
        onPick(place);
      } catch (e) {
        setResolving(false);
        setError(e.message || 'Failed to resolve location');
      }
    } else if (item.lat != null) {
      onPick({ name: item.name, shortName: item.shortName, lat: item.lat, lng: item.lng });
    }
  }

  const showRecents = !query.trim();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

        <View style={styles.head}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Choose location</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search a city or area"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            autoFocus
            autoCorrect={false}
            autoCapitalize="words"
          />
          {loading || resolving ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : query ? (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {current ? (
          <View style={styles.currentRow}>
            <Ionicons name="navigate-circle" size={14} color={COLORS.highlight} />
            <Text style={styles.currentText}>Current: {current.name}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {showRecents ? (
          <FlatList
            data={RECENT}
            keyExtractor={(i) => i.shortName}
            ListHeaderComponent={
              <Text style={styles.sectionLabel}>Popular cities</Text>
            }
            renderItem={({ item }) => (
              <ResultRow
                primary={item.shortName}
                secondary={item.name}
                icon="business-outline"
                onPress={() => handlePick(item)}
              />
            )}
          />
        ) : (
          <FlatList
            data={predictions}
            keyExtractor={(i) => i.id}
            ListEmptyComponent={
              !loading && debounced.length >= 2 ? (
                <View style={styles.empty}>
                  <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>No matches for "{debounced}"</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <ResultRow
                primary={item.primary}
                secondary={item.secondary}
                icon="location-outline"
                onPress={() => handlePick(item)}
              />
            )}
          />
        )}
      </View>
    </Modal>
  );
}

function ResultRow({ primary, secondary, icon, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={16} color={COLORS.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowPrimary} numberOfLines={1}>{primary}</Text>
        {secondary ? (
          <Text style={styles.rowSecondary} numberOfLines={1}>{secondary}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

ResultRow.propTypes = {
  primary: PropTypes.string,
  secondary: PropTypes.string,
  icon: PropTypes.string,
  onPress: PropTypes.func,
};

LocationPickerSheet.propTypes = {
  visible: PropTypes.bool.isRequired,
  current: PropTypes.shape({
    name: PropTypes.string,
    shortName: PropTypes.string,
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  onClose: PropTypes.func.isRequired,
  onPick: PropTypes.func.isRequired,
};

const TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.sm;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong, paddingTop: TOP },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TYPE_SCALE.title,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.base,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY.body,
    fontSize: 14,
    paddingVertical: 0,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  currentText: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    margin: SPACING.base,
    padding: SPACING.md,
    backgroundColor: 'rgba(255,92,122,0.08)',
    borderColor: 'rgba(255,92,122,0.3)',
    borderWidth: 1,
    borderRadius: RADII.md,
  },
  errorText: {
    flex: 1,
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.error,
  },
  sectionLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,84,130,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowPrimary: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  rowSecondary: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    padding: SPACING.huge,
    gap: 6,
  },
  emptyText: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
  },
});
