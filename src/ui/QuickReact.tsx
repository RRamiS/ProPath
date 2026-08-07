/**
 * Minijuego de reacción: esperá la señal y tocá en la ventana.
 * Tocá antes = fallás. Llegás tarde = fallás.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, tones } from './theme';

export function QuickReact({
  label,
  onDone,
}: {
  label: string;
  onDone: (success: boolean) => void;
}) {
  const [phase, setPhase] = useState<'wait' | 'go' | 'done'>('wait');
  const done = useRef(false);
  const delayMs = useRef(900 + Math.floor(Math.random() * 1200));
  const windowMs = 600;

  useEffect(() => {
    const goTimer = setTimeout(() => {
      if (!done.current) setPhase('go');
    }, delayMs.current);
    const missTimer = setTimeout(() => {
      if (done.current) return;
      done.current = true;
      setPhase('done');
      onDone(false);
    }, delayMs.current + windowMs);
    return () => {
      clearTimeout(goTimer);
      clearTimeout(missTimer);
    };
  }, [onDone]);

  const tap = () => {
    if (done.current) return;
    if (phase === 'wait') {
      done.current = true;
      setPhase('done');
      onDone(false);
      return;
    }
    if (phase === 'go') {
      done.current = true;
      setPhase('done');
      onDone(true);
    }
  };

  const hint =
    phase === 'wait' ? 'Esperá la señal…' : phase === 'go' ? '¡YA!' : 'Listo';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.hint, phase === 'go' && styles.hintGo]}>{hint}</Text>
      <Pressable
        onPress={tap}
        style={[styles.btn, phase === 'go' && styles.btnGo, phase === 'done' && styles.btnDone]}
      >
        <Text style={[styles.btnText, phase === 'go' && styles.btnTextGo]}>
          {phase === 'wait' ? 'ESPERÁ' : phase === 'go' ? 'TOCAR' : '—'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: tones.warn.border,
    backgroundColor: colors.bgCard,
  },
  label: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 },
  hint: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    textAlign: 'center',
  },
  hintGo: {
    color: tones.warn.fg,
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    letterSpacing: 1,
  },
  btn: {
    alignSelf: 'center',
    minWidth: 140,
    paddingHorizontal: 22,
    paddingVertical: 14,
    backgroundColor: colors.bgSunken,
    borderWidth: 1,
    borderColor: tones.warn.border,
  },
  btnGo: { backgroundColor: tones.warn.fg, borderColor: tones.warn.fg },
  btnDone: { opacity: 0.55 },
  btnText: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  btnTextGo: { color: colors.onAccent },
});
