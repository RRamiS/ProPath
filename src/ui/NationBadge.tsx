import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, SKEW, tones, UNSKEW, type Tone } from './theme';

/**
 * Los emoji de bandera no renderizan en Windows ni en varios Android, así que
 * usamos códigos tipo camiseta: además pega mejor con el look de broadcast.
 */
const CODES: Record<string, string> = {
  ar: 'ARG',
  br: 'BRA',
  kr: 'KOR',
  cn: 'CHN',
  us: 'USA',
  eu: 'EUW',
};

export function nationCode(nationId?: string): string {
  if (!nationId) return '—';
  return CODES[nationId] ?? nationId.toUpperCase();
}

export function NationBadge({
  nationId,
  tone = 'muted',
  solid,
}: {
  nationId?: string;
  tone?: Tone;
  solid?: boolean;
}) {
  const t = tones[tone];
  return (
    <View
      style={[
        styles.badge,
        solid
          ? { backgroundColor: t.fg, borderColor: t.fg }
          : { backgroundColor: t.bg, borderColor: t.border },
      ]}
    >
      <Text style={[styles.text, { color: solid ? colors.bg : t.fg }]}>
        {nationCode(nationId)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderWidth: 1,
    transform: [{ skewX: SKEW }],
  },
  text: {
    fontFamily: fonts.display,
    fontSize: 11,
    letterSpacing: 0.6,
    transform: [{ skewX: UNSKEW }],
  },
});
