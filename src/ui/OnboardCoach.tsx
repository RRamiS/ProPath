/**
 * Coach de primera semana: objetivo → objeto → 3 opciones → skill → mapa.
 * Cada paso puede avanzar con la acción pedida O con "Siguiente" (anti soft-lock).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, SKEW, space, tones, UNSKEW } from './theme';

export const ONBOARD_STEPS = [
  {
    step: 0,
    label: '1/5',
    title: 'Tu OBJETIVO está arriba',
    body: 'La barra OBJETIVO del HUD es tu meta de la semana (ej. ganar series). Cumplirla da premio. También la ves en DATA.',
  },
  {
    step: 1,
    label: '2/5',
    title: 'Tocá un objeto',
    body: 'Cama, PC, cámara… cada cosa es una acción: entrenar, descansar, contenido o laburar con el equipo.',
  },
  {
    step: 2,
    label: '3/5',
    title: 'Elegí entre 3',
    body: 'Cada opción muestra qué sube y qué baja. No hace falta saber jerga: mirá los chips (+mecánicas, −fatiga, etc.).',
  },
  {
    step: 3,
    label: '4/5',
    title: 'Ejecutá el skill',
    body: 'Si dice timing, reacción, tap u ordenar: un mini-reto. Acertar o fallar cambia el resultado.',
  },
  {
    step: 4,
    label: '5/5',
    title: 'Mapa y gente',
    body: 'Abrí MAPA para viajar a otras sedes y hablar con coach, duo o rival. Ellos se acuerdan de lo que dijiste.',
  },
] as const;

export function OnboardCoach({
  step,
  onSkip,
  onOpenMap,
  onShowMeta,
  onNext,
}: {
  step: number;
  onSkip: () => void;
  onOpenMap?: () => void;
  onShowMeta?: () => void;
  /** Avanza un paso sin hacer la acción (evita quedar trabado). */
  onNext?: () => void;
}) {
  const current = ONBOARD_STEPS.find((s) => s.step === step) ?? ONBOARD_STEPS[0]!;
  const last = step >= ONBOARD_STEPS.length - 1;

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
      {step === 0 && onShowMeta ? (
        <Pressable onPress={onShowMeta} style={styles.cta}>
          <Text style={styles.ctaText}>VER OBJETIVOS →</Text>
        </Pressable>
      ) : null}
      {step === 4 && onOpenMap ? (
        <Pressable onPress={onOpenMap} style={styles.cta}>
          <Text style={styles.ctaText}>ABRIR MAPA →</Text>
        </Pressable>
      ) : null}
      {last && onSkip ? (
        <Pressable onPress={onSkip} style={styles.nextGhost}>
          <Text style={styles.nextGhostText}>Listo, ya entendí</Text>
        </Pressable>
      ) : null}
      {!last && onNext ? (
        <Pressable onPress={onNext} style={styles.nextGhost}>
          <Text style={styles.nextGhostText}>Siguiente →</Text>
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
  nextGhost: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  nextGhostText: {
    color: tones.gold.fg,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.4,
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
