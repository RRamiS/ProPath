/**
 * Tutorial rejugable desde el menú (sin depender de la primera semana).
 */
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ONBOARD_STEPS } from './OnboardCoach';
import { colors, fonts, maxContentWidth, radius, SKEW, space, tones, UNSKEW } from './theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function HowToSheet({ visible, onClose }: Props) {
  const [step, setStep] = useState(0);
  const current = ONBOARD_STEPS[step] ?? ONBOARD_STEPS[0]!;
  const last = step >= ONBOARD_STEPS.length - 1;

  const close = () => {
    setStep(0);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.head}>
            <View style={styles.tab}>
              <Text style={styles.tabText}>CÓMO SE JUEGA · {current.label}</Text>
            </View>
            <Pressable onPress={close} hitSlop={10}>
              <Text style={styles.close}>Cerrar</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
          <View style={styles.dots}>
            {ONBOARD_STEPS.map((s) => (
              <View
                key={s.step}
                style={[styles.dot, s.step === step && styles.dotOn, s.step < step && styles.dotDone]}
              />
            ))}
          </View>
          <View style={styles.actions}>
            {step > 0 ? (
              <Pressable onPress={() => setStep((s) => s - 1)} style={styles.ghost}>
                <Text style={styles.ghostText}>Atrás</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <Pressable
              onPress={() => (last ? close() : setStep((s) => s + 1))}
              style={styles.next}
            >
              <Text style={styles.nextText}>{last ? 'Listo' : 'Siguiente'}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 10, 16, 0.78)',
    justifyContent: 'center',
    padding: space.lg,
  },
  card: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: tones.gold.border,
    borderRadius: radius.md,
    padding: 18,
    gap: 8,
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
  close: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  body: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  dotOn: { backgroundColor: tones.gold.fg },
  dotDone: { backgroundColor: 'rgba(200,160,40,0.45)' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  ghost: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  ghostText: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  next: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: tones.gold.fg,
    transform: [{ skewX: SKEW }],
  },
  nextText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.8,
    transform: [{ skewX: UNSKEW }],
  },
});
