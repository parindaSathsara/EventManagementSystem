import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../theme';
import { uploads } from '../../services/api';
// Direct file import (not the hooks barrel) — keeps shared/components from
// pulling providers + repos into every screen that imports a component.
import useAlert from '../hooks/useAlert';
import Avatar from './Avatar';

/**
 * Circular profile-photo picker with upload progress.
 *
 * Shows the current photo (or the initials fallback), a camera badge, and
 * Gallery / Camera buttons underneath. Uploads to POST /uploads/image and
 * hands the resulting absolute URL back via `onChange(url)`; `onChange(null)`
 * fires when the photo is removed.
 *
 * The caller owns persistence — this component only produces the URL.
 */
export default function AvatarPicker({
  value,
  name,
  size = 96,
  onChange,
  onUploadingChange,
  label = 'Profile photo',
  hint,
}) {
  const alert = useAlert();
  // Local preview shows the picked file instantly; `value` takes over once
  // the backend has accepted the upload.
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const shown = preview || value || null;

  function setBusy(busy) {
    setUploading(busy);
    if (onUploadingChange) onUploadingChange(busy);
  }

  async function pick(fromCamera) {
    if (uploading) return;
    try {
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          alert.error(
            'Camera not allowed',
            'Allow camera access in your phone settings to take a profile photo.',
          );
          return;
        }
      }
      const opts = {
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [1, 1], // square crop — the avatar is always a circle
      };
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setPreview(asset.uri);
      setBusy(true);
      setProgress(0);
      const uploaded = await uploads.uploadImage(
        { uri: asset.uri, mimeType: asset.mimeType, filename: asset.fileName },
        { onProgress: setProgress },
      );
      setPreview(null);
      if (onChange) onChange(uploaded.url);
    } catch (e) {
      setPreview(null);
      alert.error(
        'Upload failed',
        e?.message || 'Could not upload the photo. Check your connection and try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    if (uploading) return;
    setPreview(null);
    if (onChange) onChange(null);
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => pick(false)}
        disabled={uploading}
        style={styles.avatarWrap}
      >
        {shown ? (
          <Image
            source={{ uri: shown }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <Avatar name={name} size={size} />
        )}

        {uploading ? (
          <View style={[styles.uploadOverlay, { borderRadius: size / 2 }]}>
            <ActivityIndicator color={COLORS.textPrimary} />
            <Text style={styles.uploadPct}>{Math.round(progress * 100)}%</Text>
          </View>
        ) : (
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color="#000" />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => pick(false)}
          disabled={uploading}
        >
          <Ionicons name="images-outline" size={15} color={COLORS.accent} />
          <Text style={styles.actionText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => pick(true)}
          disabled={uploading}
        >
          <Ionicons name="camera-outline" size={15} color={COLORS.accent} />
          <Text style={styles.actionText}>Camera</Text>
        </TouchableOpacity>
        {shown ? (
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={remove}
            disabled={uploading}
          >
            <Ionicons name="trash-outline" size={15} color={COLORS.error} />
            <Text style={[styles.actionText, { color: COLORS.error }]}>Remove</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

AvatarPicker.propTypes = {
  value: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.number,
  onChange: PropTypes.func,
  onUploadingChange: PropTypes.func,
  label: PropTypes.string,
  hint: PropTypes.string,
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: SPACING.sm },
  label: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
  avatarWrap: { position: 'relative' },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bgStrong,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  uploadPct: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textPrimary,
  },
  actions: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', justifyContent: 'center' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    backgroundColor: COLORS.surface2,
  },
  actionText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.accent,
  },
  hint: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
