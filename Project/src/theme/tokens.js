/**
 * EventSocial Design Tokens
 * Source of truth for all colors, spacing, radii, shadows, and motion values.
 */

export const COLORS = {
  // Dark Foundation
  bgStrong: '#000000',
  bgDefault: '#0A0A0A',
  bgSoft: '#111111',
  surface1: '#121212',
  surface2: '#1A1A1A',
  surface3: '#222222',
  lineSubtle: '#2A2A2A',
  lineStrong: '#3A3A3A',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#F3F4F6',
  textMuted: '#E5E7EB',
  textInverse: '#000000',

  // Light Surfaces
  paper: '#FFFFFF',
  paperSoft: '#F4F5F7',
  paperLine: '#DBDEE5',
  ink: '#000000',
  inkMuted: '#515866',

  // Accents
  accent: '#2563EB',
  highlight: '#3B82F6',
  neonPink: '#FF2BD6',
  neonPinkSoft: '#FF4DDA',

  // UI Whites
  softWhite: '#F3F4F6',
  lightWhiteGlow: '#E5E7EB',

  // Functional
  ok: '#2563EB',
  warn: '#FFB020',
  error: '#FF5C7A',
  info: '#3B82F6',

  // Overlays
  overlayLight: 'rgba(255, 255, 255, 0.06)',
  overlayMedium: 'rgba(255, 255, 255, 0.10)',
  overlayDark: 'rgba(0, 0, 0, 0.45)',
};

export const SPACING = {
  xs: 4,    // space-1
  sm: 8,    // space-2
  md: 12,   // space-3
  base: 16, // space-4
  lg: 20,   // space-5
  xl: 24,   // space-6
  xxl: 32,  // space-8
  xxxl: 40, // space-10
  huge: 48, // space-12
  max: 64,  // space-16
};

export const RADII = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const BORDERS = {
  hairline: 1,
  emphasis: 2,
};

export const SHADOWS = {
  surface: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 0,
    elevation: 1,
  },
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 6,
  },
  overlay: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 36,
    elevation: 12,
  },
};

export const MOTION = {
  durationFast: 120,
  durationBase: 180,
  durationSlow: 240,
};
