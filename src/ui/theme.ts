import { Platform } from 'react-native';

/** Paleta: esports premium, no “AI purple”. */
export const colors = {
  bg: '#070A0F',
  bgElevated: '#0E141C',
  bgCard: '#141C27',
  bgCardHover: '#1A2432',
  line: 'rgba(232, 238, 246, 0.08)',
  lineStrong: 'rgba(232, 238, 246, 0.16)',
  text: '#F2F5F9',
  muted: '#8A97A8',
  faint: '#5C6B7C',
  accent: '#3DDC97',
  accentSoft: 'rgba(61, 220, 151, 0.14)',
  accentDeep: '#1F8F5F',
  danger: '#FF6B7A',
  gold: '#E8C56B',
  blue: '#6BA3FF',
  white: '#FFFFFF',
};

export const fonts = {
  display: 'Syne_800ExtraBold',
  displaySemi: 'Syne_700Bold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemi: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
};

/** Springs tipo Apple: suaves, con overshoot mínimo, sensación “buttery”. */
export const springs = {
  /** Tap / press release */
  snappy: { damping: 24, stiffness: 380, mass: 0.7 },
  /** Aparición de pantallas y cards */
  soft: { damping: 22, stiffness: 180, mass: 0.9 },
  /** Barras de stats / progreso */
  progress: { damping: 28, stiffness: 140, mass: 1 },
  /** Selección de chips */
  select: { damping: 20, stiffness: 260, mass: 0.75 },
} as const;

export const timing = {
  fast: 180,
  mid: 280,
  slow: 420,
};

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  android: { elevation: 8 },
  default: {},
});
