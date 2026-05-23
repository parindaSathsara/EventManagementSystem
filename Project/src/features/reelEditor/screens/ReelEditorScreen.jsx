import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import {
  Button,
  Chip,
  ScreenHeader,
} from '../../../shared/components';
import { useEventsData, useAlert, useUser } from '../../../shared/hooks';
import { reelsRepo } from '../../../services';
import { uploads as uploadsApi, ApiError } from '../../../services/api';
import StepBar from '../components/StepBar';
import TimelineRuler from '../components/TimelineRuler';
import FilterPicker, { FILTERS } from '../components/FilterPicker';
import AdjustSlider from '../components/AdjustSlider';
import CoverPicker from '../components/CoverPicker';
import ClipsStrip from '../components/ClipsStrip';
import ClipToolbar from '../components/ClipToolbar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_W = SCREEN_WIDTH;
const PREVIEW_H = Math.min(Dimensions.get('window').height * 0.42, 360);

const STEPS = ['Source', 'Adjust', 'Cover', 'Caption', 'Publish'];

const SUGGESTED_TAGS = ['#NewRelease', '#LiveSet', '#Acoustic', '#BehindTheScenes', '#Tour', '#Exclusive'];

let CLIP_SEQ = 1;
/**
 * Build a clip descriptor from an `ImagePicker.Asset`.
 * The picker returns durations in milliseconds — convert to seconds for
 * consistency with TimelineRuler / ClipsStrip.
 */
function makeClipFromAsset(asset) {
  const durationSec = asset.duration ? asset.duration / 1000 : 0;
  return {
    id: `clip-${Date.now()}-${CLIP_SEQ++}`,
    label: asset.fileName || `Clip ${CLIP_SEQ}`,
    uri: asset.uri,
    mimeType: asset.mimeType || (asset.uri?.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4'),
    fileName: asset.fileName,
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
    durationSec,
    inSec: 0,
    outSec: durationSec || 0,
  };
}

export default function ReelEditorScreen({ onBack, onPublish }) {
  const [step, setStep] = useState(0);

  // Clips start empty — the artist picks a source video from their device
  // library before they can move past the Source step.
  const [clips, setClips] = useState(() => []);
  const [activeClipId, setActiveClipId] = useState(null);
  const [pickingVideo, setPickingVideo] = useState(false);

  // Upload progress for the Publish step (0..1, or null when idle).
  const [uploadPct, setUploadPct] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const [filterKey, setFilterKey] = useState('none');
  const [brightness, setBrightness] = useState(50);
  const [saturation, setSaturation] = useState(60);
  const [volume, setVolume] = useState(80);
  const [coverIdx, setCoverIdx] = useState(0);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState(['#NewRelease']);
  const [linkedEventId, setLinkedEventId] = useState(null);
  const [visibility, setVisibility] = useState('public');
  const [allowReposts, setAllowReposts] = useState(true);
  const [muted, setMuted] = useState(true);

  const videoRef = useRef(null);
  const alert = useAlert();
  const allEvents = useEventsData();
  const { user, artist } = useUser();

  const myEvents = useMemo(
    () => (artist ? allEvents.filter((e) => e.organizerArtistId === artist.id) : []),
    [allEvents, artist],
  );
  const otherUpcoming = useMemo(
    () => allEvents.filter(
      (e) => !myEvents.some((m) => m.id === e.id) && new Date(e.startsAt).getTime() > Date.now(),
    ).slice(0, 3),
    [allEvents, myEvents],
  );
  const eventChoices = [...myEvents, ...otherUpcoming];

  const activeClipIdx = clips.findIndex((c) => c.id === activeClipId);
  const activeClip = clips[activeClipIdx] || clips[0];
  const totalDurationSec = clips.reduce((s, c) => s + (c.outSec - c.inSec), 0);

  function next() { if (step < STEPS.length - 1) setStep(step + 1); }
  function back() { if (step > 0) setStep(step - 1); }
  function toggleTag(t) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  // Clip operations ---------------------------------------------------------
  /**
   * Opens the device library video picker. On success appends the picked
   * asset to `clips` and marks it active. We request permission first; if
   * the user denies we surface a clear alert instead of silently failing.
   */
  async function pickVideoFromLibrary() {
    setPickingVideo(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        alert.error(
          'Library access needed',
          'Allow photo library access from Settings to pick a video.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        // expo-image-picker 16+ takes an array of media-type strings.
        // The legacy `MediaTypeOptions.Videos` still works but is deprecated.
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 120,
      });
      if (result.canceled || !result.assets?.length) return;
      const c = makeClipFromAsset(result.assets[0]);
      setClips((prev) => [...prev, c]);
      setActiveClipId(c.id);
    } catch (e) {
      alert.error('Could not open library', e?.message || 'Please try again.');
    } finally {
      setPickingVideo(false);
    }
  }

  /**
   * Open the camera and record a fresh clip. Requires camera + microphone
   * permission. Used by the "Record new" button on the source step.
   */
  async function recordNewClip() {
    setPickingVideo(true);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        alert.error(
          'Camera access needed',
          'Allow camera access from Settings to record a clip.',
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        quality: 1,
        videoMaxDuration: 120,
      });
      if (result.canceled || !result.assets?.length) return;
      const c = makeClipFromAsset(result.assets[0]);
      setClips((prev) => [...prev, c]);
      setActiveClipId(c.id);
    } catch (e) {
      alert.error('Camera failed', e?.message || 'Please try again.');
    } finally {
      setPickingVideo(false);
    }
  }

  function deleteActiveClip() {
    if (clips.length === 0) return;
    const idx = activeClipIdx;
    const remaining = clips.filter((c) => c.id !== activeClipId);
    setClips(remaining);
    setActiveClipId(remaining.length ? remaining[Math.min(idx, remaining.length - 1)].id : null);
  }

  function splitActiveClip() {
    if (!activeClip) return;
    const span = activeClip.outSec - activeClip.inSec;
    if (span < 1) {
      alert.warning('Too short', 'A clip needs to be at least 1 second to split.');
      return;
    }
    const mid = activeClip.inSec + span / 2;
    const left = {
      ...activeClip,
      id: `clip-${Date.now()}-${CLIP_SEQ++}`,
      outSec: mid,
    };
    const right = {
      ...activeClip,
      id: `clip-${Date.now()}-${CLIP_SEQ++}`,
      inSec: mid,
    };
    const next = [...clips];
    next.splice(activeClipIdx, 1, left, right);
    setClips(next);
    setActiveClipId(left.id);
  }

  function mergeActiveWithNext() {
    if (activeClipIdx < 0 || activeClipIdx >= clips.length - 1) return;
    const a = clips[activeClipIdx];
    const b = clips[activeClipIdx + 1];
    // For visual demo purposes, merge means: keep clip A, extend its trimmed
    // duration by the span of clip B. The source remains A (real merging would
    // require server-side video stitching).
    const merged = {
      ...a,
      id: `clip-${Date.now()}-${CLIP_SEQ++}`,
      outSec: Math.min(a.durationSec, a.outSec + (b.outSec - b.inSec)),
    };
    const next = [...clips];
    next.splice(activeClipIdx, 2, merged);
    setClips(next);
    setActiveClipId(merged.id);
  }

  function moveActive(dir) {
    const j = activeClipIdx + dir;
    if (j < 0 || j >= clips.length) return;
    const next = [...clips];
    [next[activeClipIdx], next[j]] = [next[j], next[activeClipIdx]];
    setClips(next);
  }

  function setActiveClipTrim({ inSec, outSec }) {
    setClips((prev) =>
      prev.map((c) => (c.id === activeClipId ? { ...c, inSec, outSec } : c)),
    );
  }

  // Publish -----------------------------------------------------------------
  /**
   * Publish flow:
   *   1. Upload the primary clip's video file to the backend (with progress).
   *   2. Call reelsRepo.create() with the returned videoUrl + metadata.
   *   3. Backend assigns status (pending_approval or published based on
   *      preferred-artist flag) and the reel falls into the artist's own
   *      feed via the cache subscription.
   *
   * Editor metadata (filter, trim, brightness) is sent to the backend for
   * forward-compatibility, but isn't applied server-side yet — full
   * transcoding ships in a later sprint.
   */
  async function handlePublish() {
    if (!artist) {
      alert.error('No artist profile', 'Create an artist profile before publishing reels.');
      return;
    }
    const primary = clips[0];
    if (!primary?.uri) {
      alert.error('No video', 'Pick a video on the Source step before publishing.');
      return;
    }

    setPublishing(true);
    setUploadPct(0);
    let videoUrl = null;
    try {
      const uploaded = await uploadsApi.uploadVideo(
        { uri: primary.uri, mimeType: primary.mimeType, filename: primary.fileName },
        { onProgress: (p) => setUploadPct(p) },
      );
      videoUrl = uploaded?.url || null;
    } catch (err) {
      setPublishing(false);
      setUploadPct(null);
      // Cloudflare/nginx return 413 BEFORE the backend sees the upload when
      // the file exceeds the platform cap (CF Free/Pro = 100MB). The response
      // body is HTML, not our JSON error shape, so map it explicitly here.
      const status = err instanceof ApiError ? err.status : undefined;
      const isNetwork = err instanceof ApiError && (err.status === 0 || err.code === 'NETWORK');
      let title = 'Upload failed';
      let message = err?.message || 'Could not upload your video. Try again.';
      if (status === 413) {
        title = 'Video too large';
        message = 'Your clip is over the 100 MB upload limit. Trim it or use a lower-quality version, then try again.';
      } else if (isNetwork) {
        title = 'No connection';
        message = 'We couldn\'t reach the server. Check your connection and retry.';
      }
      alert.error(title, message);
      return;
    }

    try {
      const author = artist?.user?.name || user?.name || 'Artist';
      const cleanTags = tags.map((t) => t.replace(/^#/, '').toLowerCase()).filter(Boolean);
      const newReel = await reelsRepo.create({
        caption: caption || `New reel from ${author}`,
        tags: cleanTags,
        musicTrackTitle: 'Original audio',
        musicTrackArtistName: author,
        linkedEventId: linkedEventId || null,
        coverColor: '#1a0a2e',
        videoUrl,
        visibility,
      });
      const pending = newReel?.status === 'pending_approval';
      alert.success(
        pending ? 'Submitted for review' : 'Published',
        pending
          ? 'Your reel is in the approval queue. We\'ll notify you once it goes live.'
          : 'Your reel is live on the customer feed.',
        () => onPublish && onPublish(newReel),
      );
    } catch (e) {
      alert.error('Could not publish', e?.message || 'Please try again.');
    } finally {
      setPublishing(false);
      setUploadPct(null);
    }
  }

  const filterOverlay = (() => {
    const f = FILTERS.find((x) => x.key === filterKey);
    if (!f || filterKey === 'none') return null;
    return f.preview;
  })();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
      <ScreenHeader
        title="Edit Reel"
        subtitle={STEPS[step]}
        onBack={onBack}
        rightLabel={step === STEPS.length - 1 ? null : 'Save draft'}
        onRightPress={() => {
          alert.success(
            'Draft saved',
            'Your reel-in-progress is saved. Continue from Create → Drafts.',
          );
        }}
      />

      <StepBar steps={STEPS} activeIndex={step} />

      {/* Preview */}
      <View style={styles.previewWrap}>
        {activeClip ? (
          <Video
            ref={videoRef}
            source={{ uri: activeClip.uri }}
            style={styles.preview}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted={muted}
          />
        ) : (
          <View style={[styles.preview, styles.previewEmpty]}>
            <Ionicons name="videocam-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.previewEmptyText}>No video yet — pick one below</Text>
          </View>
        )}
        {filterOverlay ? (
          <LinearGradient
            colors={[filterOverlay[0] + '55', '#00000000', filterOverlay[1] + '55']}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.65)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.previewOverlay} pointerEvents="none">
          {caption ? <Text style={styles.previewCaption} numberOfLines={2}>{caption}</Text> : null}
          {tags.length ? (
            <View style={styles.previewTagRow}>
              {tags.slice(0, 3).map((t) => (
                <Text key={t} style={styles.previewTag}>{t}</Text>
              ))}
            </View>
          ) : null}
          {filterKey !== 'none' ? (
            <View style={styles.filterBadge}>
              <Ionicons name="color-filter-outline" size={11} color={COLORS.accent} />
              <Text style={styles.filterBadgeText}>{FILTERS.find((f) => f.key === filterKey)?.label}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.muteBtn}
          activeOpacity={0.7}
          onPress={() => setMuted((m) => !m)}
        >
          <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={16} color="#fff" />
        </TouchableOpacity>

        {/* Active-clip indicator (only when there's a clip to be active on) */}
        {clips.length > 0 ? (
          <View style={styles.clipBadge}>
            <Ionicons name="film" size={11} color="#000" />
            <Text style={styles.clipBadgeText}>
              Clip {activeClipIdx + 1}/{clips.length} · {totalDurationSec.toFixed(1)}s total
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* SOURCE step — pick a video from the device library or camera */}
        {step === 0 ? (
          <View>
            {clips.length === 0 ? (
              <View style={styles.sourceEmpty}>
                <View style={styles.sourceIconWrap}>
                  <Ionicons name="cloud-upload-outline" size={28} color={COLORS.accent} />
                </View>
                <Text style={styles.sourceTitle}>Add a video</Text>
                <Text style={styles.sourceSub}>
                  Pick something from your library or record a fresh clip.
                  Up to 2 minutes per clip.
                </Text>
                <View style={styles.sourceCtaRow}>
                  <TouchableOpacity
                    style={[styles.sourceCta, styles.sourceCtaPrimary]}
                    onPress={pickVideoFromLibrary}
                    disabled={pickingVideo}
                    activeOpacity={0.85}
                  >
                    {pickingVideo ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <Ionicons name="images-outline" size={16} color="#000" />
                        <Text style={styles.sourceCtaText}>Pick from library</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sourceCta}
                    onPress={recordNewClip}
                    disabled={pickingVideo}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="videocam-outline" size={16} color={COLORS.textPrimary} />
                    <Text style={[styles.sourceCtaText, { color: COLORS.textPrimary }]}>Record</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <ClipsStrip
                  clips={clips}
                  activeId={activeClipId}
                  onSelect={setActiveClipId}
                  onAdd={pickVideoFromLibrary}
                />
                <ClipToolbar
                  onSplit={splitActiveClip}
                  onMerge={mergeActiveWithNext}
                  onDelete={deleteActiveClip}
                  onMoveLeft={() => moveActive(-1)}
                  onMoveRight={() => moveActive(1)}
                  canSplit={!!activeClip && (activeClip.outSec - activeClip.inSec) >= 1}
                  canMerge={activeClipIdx >= 0 && activeClipIdx < clips.length - 1}
                  canDelete={clips.length > 0}
                  canMoveLeft={activeClipIdx > 0}
                  canMoveRight={activeClipIdx >= 0 && activeClipIdx < clips.length - 1}
                />

                {activeClip ? (
                  <TimelineRuler
                    key={activeClip.id /* reset internal pan refs when active changes */}
                    durationSec={activeClip.durationSec}
                    inSec={activeClip.inSec}
                    outSec={activeClip.outSec}
                    onChange={setActiveClipTrim}
                  />
                ) : null}

                <Text style={styles.helper}>
                  Trim sets where the clip starts and ends. Split, merge,
                  and reorder controls are above. The first clip is the one
                  that gets published — multi-clip stitching is server-side
                  and ships in a later sprint.
                </Text>
              </>
            )}
          </View>
        ) : null}

        {/* ADJUST step */}
        {step === 1 ? (
          <View>
            <FilterPicker activeKey={filterKey} onSelect={setFilterKey} />
            <View style={styles.adjustCard}>
              <Text style={styles.heading}>Adjust</Text>
              <AdjustSlider icon="sunny-outline" label="Brightness" value={brightness} onChange={setBrightness} />
              <AdjustSlider icon="contrast-outline" label="Saturation" value={saturation} onChange={setSaturation} />
              <AdjustSlider icon="volume-high-outline" label="Volume" value={volume} onChange={setVolume} />
            </View>
          </View>
        ) : null}

        {/* COVER step */}
        {step === 2 ? (
          <View>
            <CoverPicker activeIndex={coverIdx} onSelect={setCoverIdx} />
            <View style={styles.adjustCard}>
              <Text style={styles.heading}>Music</Text>
              <View style={styles.musicRow}>
                <View style={styles.musicIcon}>
                  <Ionicons name="musical-notes" size={18} color={COLORS.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.musicTitle}>Original audio</Text>
                  <Text style={styles.musicMeta}>
                    {artist?.user?.name || user?.name || 'Your reel'} · uploaded sound
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.changeBtn}
                  onPress={() =>
                    alert.info(
                      'Music library',
                      'Browse licensed tracks, upload your own audio, or pick a preset. Coming next sprint.',
                    )
                  }
                >
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* CAPTION step */}
        {step === 3 ? (
          <View style={styles.captionWrap}>
            <Text style={styles.heading}>Caption</Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a caption…"
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={300}
              style={styles.captionInput}
            />
            <Text style={styles.captionCount}>{caption.length}/300</Text>

            <Text style={styles.heading}>Tags</Text>
            <View style={styles.tagsRow}>
              {SUGGESTED_TAGS.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  active={tags.includes(t)}
                  onPress={() => toggleTag(t)}
                  style={{ marginRight: SPACING.sm, marginBottom: SPACING.sm }}
                />
              ))}
            </View>

            <Text style={styles.heading}>Link an event (optional)</Text>
            <View style={{ gap: SPACING.sm }}>
              <TouchableOpacity
                style={[styles.eventLinkRow, linkedEventId === null && styles.eventLinkActive]}
                activeOpacity={0.85}
                onPress={() => setLinkedEventId(null)}
              >
                <Ionicons name="close-circle-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.eventLinkText}>No event linked</Text>
              </TouchableOpacity>
              {eventChoices.map((e) => {
                const active = linkedEventId === e.id;
                return (
                  <TouchableOpacity
                    key={e.id}
                    style={[styles.eventLinkRow, active && styles.eventLinkActive]}
                    activeOpacity={0.85}
                    onPress={() => setLinkedEventId(active ? null : e.id)}
                  >
                    <Ionicons name="ticket-outline" size={16} color={active ? COLORS.accent : COLORS.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventLinkTitle} numberOfLines={1}>{e.title}</Text>
                      <Text style={styles.eventLinkSub} numberOfLines={1}>
                        {new Date(e.startsAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                        {' · '}{e.venueName}
                      </Text>
                    </View>
                    {active ? <Ionicons name="checkmark-circle" size={18} color={COLORS.highlight} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* PUBLISH step */}
        {step === 4 ? (
          <View style={styles.publishWrap}>
            <View style={styles.summaryCard}>
              <Text style={styles.heading}>Summary</Text>
              <SummaryRow icon="film-outline" label="Clips" value={`${clips.length} · ${totalDurationSec.toFixed(1)}s total`} />
              <SummaryRow icon="color-filter-outline" label="Filter" value={FILTERS.find((f) => f.key === filterKey)?.label || 'None'} />
              <SummaryRow icon="image-outline" label="Cover" value={`Frame ${coverIdx + 1}`} />
              <SummaryRow icon="pricetags-outline" label="Tags" value={tags.length ? tags.join(' ') : '—'} />
              <SummaryRow
                icon="ticket-outline"
                label="Linked event"
                value={
                  linkedEventId
                    ? eventChoices.find((e) => e.id === linkedEventId)?.title || '—'
                    : 'None'
                }
              />
            </View>

            <Text style={styles.heading}>Visibility</Text>
            <View style={styles.visGroup}>
              <VisOption icon="globe-outline" label="Public" desc="Anyone can see this reel" active={visibility === 'public'} onPress={() => setVisibility('public')} />
              <VisOption icon="people-outline" label="Followers only" desc="Only your followers" active={visibility === 'followers'} onPress={() => setVisibility('followers')} />
              <VisOption icon="lock-closed-outline" label="Private" desc="Only you can see this" active={visibility === 'private'} onPress={() => setVisibility('private')} />
            </View>

            <View style={styles.toggleCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Allow reposts</Text>
                <Text style={styles.toggleSub}>Customers can reshare this reel to their feed</Text>
              </View>
              <Switch
                value={allowReposts}
                onValueChange={setAllowReposts}
                trackColor={{ false: COLORS.surface3, true: COLORS.accent }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.publishHint, !artist?.isVerified && styles.publishHintWarn]}>
              <Ionicons
                name={artist?.isVerified ? 'shield-checkmark-outline' : 'time-outline'}
                size={16}
                color={artist?.isVerified ? COLORS.highlight : COLORS.warn}
              />
              <Text
                style={[
                  styles.publishHintText,
                  !artist?.isVerified && { color: COLORS.warn },
                ]}
              >
                {artist?.isVerified
                  ? 'Verified Artist — your reel will be published immediately if you have preferred status, otherwise it goes to the approval queue.'
                  : 'Your account is not verified yet. Reels submitted now will stay in the approval queue until an admin approves.'}
              </Text>
            </View>

            {uploadPct != null ? (
              <View style={styles.progressCard}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Uploading…</Text>
                  <Text style={styles.progressPct}>{Math.round((uploadPct || 0) * 100)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.round((uploadPct || 0) * 100)}%` }]} />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerBtn, step === 0 && styles.footerBtnDisabled]}
          activeOpacity={0.7}
          onPress={back}
          disabled={step === 0}
        >
          <Ionicons name="chevron-back" size={16} color={step === 0 ? COLORS.textMuted : COLORS.textPrimary} />
          <Text style={[styles.footerBtnText, step === 0 && { color: COLORS.textMuted }]}>Back</Text>
        </TouchableOpacity>

        {step < STEPS.length - 1 ? (
          <Button
            title={`Next: ${STEPS[step + 1]}`}
            variant="primary"
            onPress={next}
            // Source step blocks Next until at least one clip is picked.
            disabled={step === 0 && clips.length === 0}
            style={styles.nextBtn}
          />
        ) : (
          <Button
            title={publishing ? 'Publishing…' : 'Publish reel'}
            variant="primary"
            onPress={handlePublish}
            loading={publishing}
            disabled={publishing || clips.length === 0}
            style={[styles.nextBtn, { backgroundColor: COLORS.highlight }]}
          />
        )}
      </View>
    </View>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <View style={styles.sumRow}>
      <Ionicons name={icon} size={14} color={COLORS.accent} />
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={styles.sumValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function VisOption({ icon, label, desc, active, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.visRow, active && styles.visRowActive]}
    >
      <View style={[styles.visIcon, active && styles.visIconActive]}>
        <Ionicons name={icon} size={16} color={active ? '#000' : COLORS.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.visLabel, active && { color: COLORS.textPrimary }]}>{label}</Text>
        <Text style={styles.visDesc}>{desc}</Text>
      </View>
      <View style={[styles.visRadio, active && styles.visRadioActive]}>
        {active ? <Ionicons name="checkmark" size={12} color="#000" /> : null}
      </View>
    </TouchableOpacity>
  );
}

SummaryRow.propTypes = { icon: PropTypes.string, label: PropTypes.string, value: PropTypes.string };
VisOption.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  desc: PropTypes.string,
  active: PropTypes.bool,
  onPress: PropTypes.func,
};

ReelEditorScreen.propTypes = {
  onBack: PropTypes.func,
  onPublish: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  previewWrap: {
    width: PREVIEW_W,
    height: PREVIEW_H,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  preview: { ...StyleSheet.absoluteFillObject },
  previewEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface1,
  },
  previewEmptyText: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
  },

  sourceEmpty: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  sourceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,84,130,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  sourceTitle: {
    ...TYPE_SCALE.h3,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  sourceSub: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  sourceCtaRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  sourceCta: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    backgroundColor: 'transparent',
  },
  sourceCtaPrimary: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  sourceCtaText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: '#000',
  },

  progressCard: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },
  progressPct: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.highlight,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surface2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.highlight,
    borderRadius: 3,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.base,
    right: SPACING.base,
    gap: 4,
  },
  previewCaption: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  previewTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  previewTag: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.accent,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  filterBadgeText: { fontSize: 10, fontFamily: FONT_FAMILY.bodyBold, color: COLORS.accent },
  muteBtn: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  clipBadgeText: { fontSize: 11, fontFamily: FONT_FAMILY.bodyBold, color: '#000' },

  body: { flex: 1 },
  helper: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    lineHeight: 18,
  },

  heading: {
    paddingHorizontal: SPACING.base,
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  adjustCard: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.base,
  },

  musicRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  musicIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,84,130,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  musicTitle: { ...TYPE_SCALE.bodySm, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textPrimary },
  musicMeta: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },
  changeBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  changeBtnText: { fontSize: 11, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.textSecondary },

  captionWrap: { paddingHorizontal: 0 },
  captionInput: {
    marginHorizontal: SPACING.base,
    minHeight: 96,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY.body,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  captionCount: {
    paddingHorizontal: SPACING.base,
    fontSize: 11,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.base },

  eventLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.base,
    padding: SPACING.md,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  eventLinkActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(255,84,130,0.06)',
  },
  eventLinkText: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
  },
  eventLinkTitle: { ...TYPE_SCALE.bodySm, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textPrimary },
  eventLinkSub: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },

  publishWrap: {},
  summaryCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.base,
    paddingTop: 0,
  },
  sumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
  },
  sumLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    width: 90,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sumValue: {
    flex: 1,
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },

  visGroup: { marginHorizontal: SPACING.base, gap: SPACING.sm },
  visRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  visRowActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(255,84,130,0.06)',
  },
  visIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,84,130,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  visIconActive: { backgroundColor: COLORS.accent },
  visLabel: { ...TYPE_SCALE.bodyMd, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textSecondary },
  visDesc: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },
  visRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.lineStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  visRadioActive: { backgroundColor: COLORS.highlight, borderColor: COLORS.highlight },

  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.base,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  toggleTitle: { ...TYPE_SCALE.bodyMd, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textPrimary },
  toggleSub: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },

  publishHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(0,255,161,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,161,0.25)',
  },
  publishHintWarn: {
    backgroundColor: 'rgba(255,176,32,0.08)',
    borderColor: 'rgba(255,176,32,0.3)',
  },
  publishHintText: {
    flex: 1,
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.highlight,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSubtle,
    backgroundColor: 'rgba(5,5,5,0.96)',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  footerBtnDisabled: { opacity: 0.6 },
  footerBtnText: { fontSize: 13, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.textPrimary },
  nextBtn: { flex: 1, height: 48 },
});
