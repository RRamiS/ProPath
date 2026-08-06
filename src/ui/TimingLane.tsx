import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, tones } from './theme';

/** Verbo gráfico: mantener/timing en una lane. */
export function TimingLane({
  label,
  onDone,
  durationMs = 1800,
}: {
  label: string;
  onDone: (success: boolean) => void;
  durationMs?: number;
}) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!holding) return;
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / durationMs);
      setProgress(p);
      if (p >= 1) {
        clearInterval(id);
        onDone(true);
      }
    }, 40);
    return () => clearInterval(id);
  }, [holding, durationMs, onDone]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.lane}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <Pressable
        onPressIn={() => setHolding(true)}
        onPressOut={() => {
          if (progress < 1) {
            setHolding(false);
            setProgress(0);
            onDone(false);
          }
        }}
        style={[styles.btn, holding && styles.btnOn]}
      >
        <Text style={styles.btnText}>{holding ? 'MANTENÉ…' : 'MANTENER'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, padding: 12, borderWidth: 1, borderColor: tones.warn.border, backgroundColor: colors.bgCard },
  label: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 },
  lane: { height: 10, backgroundColor: colors.bgSunken, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: tones.warn.fg },
  btn: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: tones.warn.fg,
  },
  btnOn: { opacity: 0.85 },
  btnText: { color: colors.onAccent, fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1 },
});
