// Enhanced color system with light/dark mode support
// Design tokens for SlipWise expense tracker

// Brand Colors
const BRAND_PRIMARY = '#6366F1'; // Indigo - modern, professional
const BRAND_PRIMARY_DARK = '#4F46E5'; // Darker indigo for interactions
const BRAND_SECONDARY = '#EC4899'; // Pink - for accents
const BRAND_SUCCESS = '#10B981'; // Emerald - for positive values
const BRAND_WARNING = '#F59E0B'; // Amber - for warnings
const BRAND_DANGER = '#EF4444'; // Red - for delete/errors

// Neutral Colors - Light Mode
const LIGHT_BG_PRIMARY = '#FFFFFF';
const LIGHT_BG_SECONDARY = '#F9FAFB';
const LIGHT_BG_TERTIARY = '#F3F4F6';
const LIGHT_TEXT_PRIMARY = '#1F2937';
const LIGHT_TEXT_SECONDARY = '#6B7280';
const LIGHT_TEXT_TERTIARY = '#9CA3AF';
const LIGHT_BORDER = '#E5E7EB';
const LIGHT_BORDER_STRONG = '#D1D5DB';

// Neutral Colors - Dark Mode
const DARK_BG_PRIMARY = '#0F172A';
const DARK_BG_SECONDARY = '#1E293B';
const DARK_BG_TERTIARY = '#334155';
const DARK_TEXT_PRIMARY = '#F1F5F9';
const DARK_TEXT_SECONDARY = '#CBD5E1';
const DARK_TEXT_TERTIARY = '#94A3B8';
const DARK_BORDER = '#475569';
const DARK_BORDER_STRONG = '#64748B';

// Shadow colors
const LIGHT_SHADOW = 'rgba(0, 0, 0, 0.08)';
const DARK_SHADOW = 'rgba(0, 0, 0, 0.3)';

// Gradient combinations
export const gradients = {
  light: {
    primary: ['#6366F1', '#8B5CF6'], // Indigo to Purple
    success: ['#10B981', '#059669'], // Emerald gradient
    warning: ['#F59E0B', '#F97316'], // Amber to Orange
    danger: ['#EF4444', '#DC2626'], // Red gradient
    cool: ['#06B6D4', '#0891B2'], // Cyan gradient
  },
  dark: {
    primary: ['#6366F1', '#7C3AED'], // Indigo to Violet
    success: ['#10B981', '#047857'], // Emerald gradient
    warning: ['#F59E0B', '#D97706'], // Amber to Orange
    danger: ['#EF4444', '#B91C1C'], // Red gradient
    cool: ['#06B6D4', '#0369A1'], // Cyan gradient
  },
};

export default {
  light: {
    // Background
    background: LIGHT_BG_PRIMARY,
    backgroundSecondary: LIGHT_BG_SECONDARY,
    backgroundTertiary: LIGHT_BG_TERTIARY,

    // Text
    text: LIGHT_TEXT_PRIMARY,
    textSecondary: LIGHT_TEXT_SECONDARY,
    textTertiary: LIGHT_TEXT_TERTIARY,

    // Brand
    primary: BRAND_PRIMARY,
    primaryDark: BRAND_PRIMARY_DARK,
    secondary: BRAND_SECONDARY,
    success: BRAND_SUCCESS,
    warning: BRAND_WARNING,
    danger: BRAND_DANGER,

    // Borders
    border: LIGHT_BORDER,
    borderStrong: LIGHT_BORDER_STRONG,

    // Component specific
    tabIconDefault: '#9CA3AF',
    tabIconSelected: BRAND_PRIMARY,
    cardBackground: LIGHT_BG_PRIMARY,
    inputBackground: LIGHT_BG_SECONDARY,
    inputBorder: LIGHT_BORDER,
    shadow: LIGHT_SHADOW,

    // Utility
    transparent: 'transparent',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    // Background
    background: DARK_BG_PRIMARY,
    backgroundSecondary: DARK_BG_SECONDARY,
    backgroundTertiary: DARK_BG_TERTIARY,

    // Text
    text: DARK_TEXT_PRIMARY,
    textSecondary: DARK_TEXT_SECONDARY,
    textTertiary: DARK_TEXT_TERTIARY,

    // Brand
    primary: BRAND_PRIMARY,
    primaryDark: BRAND_PRIMARY_DARK,
    secondary: BRAND_SECONDARY,
    success: BRAND_SUCCESS,
    warning: BRAND_WARNING,
    danger: BRAND_DANGER,

    // Borders
    border: DARK_BORDER,
    borderStrong: DARK_BORDER_STRONG,

    // Component specific
    tabIconDefault: DARK_TEXT_TERTIARY,
    tabIconSelected: BRAND_PRIMARY,
    cardBackground: DARK_BG_PRIMARY,
    inputBackground: DARK_BG_TERTIARY,
    inputBorder: DARK_BORDER,
    shadow: DARK_SHADOW,

    // Utility
    transparent: 'transparent',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

// Typography Scale
export const typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },

  // Body text
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18,
  },

  // Labels
  labelLarge: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
};

// Spacing Scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

// Border Radius
export const borderRadius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadow definitions
export const shadows = {
  light: {
    small: {
      shadowColor: LIGHT_SHADOW,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: LIGHT_SHADOW,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: LIGHT_SHADOW,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  dark: {
    small: {
      shadowColor: DARK_SHADOW,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: DARK_SHADOW,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: DARK_SHADOW,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};
