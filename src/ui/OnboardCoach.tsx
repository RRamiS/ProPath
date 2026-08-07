/**
 * Coach de 30s en la primera semana: objeto → 3 opciones → skill → mapa.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, SKEW, space, tones, UNSKEW } from './theme';

export const ONBOARD_STEPS = [
  {
    step: 0,
    label: '1/4',
    title: 'Tocá un objeto',
    body: 'Cama, PC, cámara… cada cosa abre una acción del bloque.',
  },
  {
    step: 1,
    label: '2/4',
    title: 'Elegí entre 3',
    body: 'Cada opción tiene pros y contras. Leé los chips antes de confirmar.',
  },
  {
    step: 2,
    label: '3/4',
    title: 'Ejecutá el skill',
    body: 'Si dice timing, reacción, tap u ordenar: no es solo un click. Acertar o fallar cambia el resultado.',
  },
  {
    step: 3,
    label: '4/4',
    title: 'Mirá el mapa',
    body: 'Abrí MAPA arriba. Vas a ver quién está en cada sede. Tocá una para viajar.',
  },
] as const;

export function OnboardCoach({
  step,
  onSkip,
  onOpenMap,
}: {
  step: number;
  onSkip: () => void;
  onOpenMap?: () => void;
}) {
  const current = ONBOARD_STEPS.find((s) => s.step === step) ?? ONBOARD_STEPS[0]!;
  return (
    <View style={styles.wrap}>
      <View style={styles.edge} />
      <View style={styles.head}>
        <View style={styles.tab}>
          <Text style={styles.tabText}>COACH · {current.label}</Text>
        </View>
        <Pressable onPress={onSkip} hitSlop={10}>
          <Text style={styles.skip}>Saltar</Text>
        </Pressable>
      </View>
      <Text style={styles.title}>{current.title}</Text>
      <Text style={styles.body}>{current.body}</Text>
      {step === 3 && onOpenMap ? (
        <Pressable onPress={onOpenMap} style={styles.cta}>
          <Text style={styles.ctaText}>ABRIR MAPA →</Text>
        </Pressable>
      ) : null}
      <View style={styles.dots}>
        {ONBOARD_STEPS.map((s) => (
          <View
            key={s.step}
            style={[styles.dot, s.step === step && styles.dotOn, s.step < step && styles.dotDone]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
    padding: 14,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: tones.gold.border,
    backgroundColor: 'rgba(200,160,40,0.1)',
    gap: 6,
    overflow: 'hidden',
  },
  edge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: tones.gold.fg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tab: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: tones.gold.fg,
    transform: [{ skewX: SKEW }],
  },
  tabText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    transform: [{ skewX: UNSKEW }],
  },
  skip: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  body: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: tones.gold.fg,
    transform: [{ skewX: SKEW }],
  },
  ctaText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    transform: [{ skewX: UNSKEW }],
  },
  dots: { flexDirection: 'row', gap: 6, marginTop: space.xs },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.lineStrong,
  },
  dotOn: { backgroundColor: tones.gold.fg, width: 16 },
  dotDone: { backgroundColor: 'rgba(200,160,40,0.45)' },
});
