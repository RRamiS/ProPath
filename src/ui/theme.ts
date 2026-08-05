import { Platform } from 'react-native';

/**
 * Lenguaje visual "Broadcast Deck": negro cálido, acentos ácidos, paneles de
 * esquina viva con tabs sesgados. Nada de tarjetas redondeadas genéricas.
 */
export const colors = {
  bg: '#08090C',
  bgSunken: '#050609',
  bgElevated: '#0D0F14',
  bgCard: '#11141B',
  bgCardHover: '#171B24',
  line: 'rgba(235, 240, 248, 0.09)',
  lineStrong: 'rgba(235, 240, 248, 0.18)',
  text: '#F4F7FB',
  muted: '#8D97A6',
  faint: '#5A6472',

  /** Acento principal: lima ácido de broadcast */
  accent: '#CCFF33',
  accentSoft: 'rgba(204, 255, 51, 0.13)',
  accentDeep: '#8FB81F',

  /** Rojo de match day */
  danger: '#FF3B5C',
  dangerSoft: 'rgba(255, 59, 92, 0.13)',

  warn: '#FFA23A',
  warnSoft: 'rgba(255, 162, 58, 0.13)',

  gold: '#FFC24B',
  goldSoft: 'rgba(255, 194, 75, 0.13)',

  /** Cian de datos / analítica */
  blue: '#2FE6E0',
  blueSoft: 'rgba(47, 230, 224, 0.12)',

  violet: '#9D7BFF',
  violetSoft: 'rgba(157, 123, 255, 0.14)',

  white: '#FFFFFF',
  onAccent: '#0B1200',
};

export type Tone = 'accent' | 'gold' | 'danger' | 'blue' | 'violet' | 'warn' | 'muted';

export const tones: Record<Tone, { fg: string; bg: string; border: string }> = {
  accent: { fg: colors.accent, bg: colors.accentSoft, border: 'rgba(204,255,51,0.42)' },
  gold: { fg: colors.gold, bg: colors.goldSoft, border: 'rgba(255,194,75,0.42)' },
  danger: { fg: colors.danger, bg: colors.dangerSoft, border: 'rgba(255,59,92,0.42)' },
  blue: { fg: colors.blue, bg: colors.blueSoft, border: 'rgba(47,230,224,0.42)' },
  violet: { fg: colors.violet, bg: colors.violetSoft, border: 'rgba(157,123,255,0.42)' },
  warn: { fg: colors.warn, bg: colors.warnSoft, border: 'rgba(255,162,58,0.42)' },
  muted: { fg: colors.muted, bg: 'rgba(235,240,248,0.05)', border: colors.line },
};

/** Cada etapa tiene su color: la carrera “cambia de piel” al subir. */
export const stageTone: Record<string, Tone> = {
  soloq: 'accent',
  academy: 'blue',
  challengers: 'violet',
  tier1: 'gold',
  worlds: 'danger',
};

export const stageGradient: Record<string, [string, string, string]> = {
  soloq: ['#0B1405', '#08090C', '#050609'],
  academy: ['#04141A', '#080D12', '#050609'],
  challengers: ['#0E0820', '#0A0A14', '#050509'],
  tier1: ['#1A1305', '#100C08', '#070604'],
  worlds: ['#1C060F', '#12070C', '#080306'],
  arena: ['#20060E', '#14060B', '#090305'],
  landing: ['#0A1605', '#07110C', '#050609'],
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
  snappy: { damping: 24, stiffness: 380, mass: 0.7 },
  soft: { damping: 22, stiffness: 180, mass: 0.9 },
  progress: { damping: 28, stiffness: 140, mass: 1 },
  select: { damping: 20, stiffness: 260, mass: 0.75 },
  bouncy: { damping: 14, stiffness: 220, mass: 0.8 },
} as const;

export const timing = {
  fast: 180,
  mid: 280,
  slow: 420,
};

/** El juego es mobile-first: en pantallas anchas centramos la columna. */
export const maxContentWidth = 560;

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/** Esquinas vivas: el look es angular, no “pastilla”. */
export const radius = {
  none: 0,
  sm: 3,
  md: 5,
  lg: 7,
  xl: 10,
  pill: 999,
};

/** Sesgo compartido por tabs y badges: la firma del sistema. */
export const SKEW = '-11deg';
export const UNSKEW = '11deg';

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 46, lineHeight: 50, letterSpacing: -2 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -1 },
  heading: { fontFamily: fonts.displaySemi, fontSize: 20, lineHeight: 25, letterSpacing: -0.4 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodySm: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 },
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 2 },
  micro: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 15 },
} as const;

export const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
  },
  android: { elevation: 8 },
  default: {},
});

export const shadowSoft = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  android: { elevation: 3 },
  default: {},
});

/** Verde → ámbar → rojo según qué tan “sano” es el valor. */
export function valueTone(value: number, invert = false): Tone {
  const v = invert ? 100 - value : value;
  if (v >= 66) return 'accent';
  if (v >= 33) return 'warn';
  return 'danger';
}
