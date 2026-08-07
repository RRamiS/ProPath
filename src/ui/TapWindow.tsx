/**
 * Minijuego: tocá cuando el marcador está en la zona verde.
 * Distinto al hold de TimingLane — sirve para pelea / clutch.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, tones } from './theme';

export function TapWindow({
  label,
  onDone,
  durationMs = 2200,
}: {
  label: string;
  onDone: (success: boolean) => void;
  durationMs?: number;
}) {
  const [pos, setPos] = useState(0);
  const done = useRef(false);
  // Zona buena centrada ~55–78%.
  const zoneStart = 0.55;
  const zoneEnd = 0.78;

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const t = (Date.now() - start) / durationMs;
      if (t >= 1) {
        clearInterval(id);
        if (!done.current) {
          done.current = true;
          onDone(false);
        }
        return;
      }
      // Ida y vuelta.
      const cycle = t * 2;
      setPos(cycle <= 1 ? cycle : 2 - cycle);
    }, 32);
    return () => clearInterval(id);
  }, [durationMs, onDone]);

  const tap = () => {
    if (done.current) return;
    done.current = true;
    onDone(pos >= zoneStart && pos <= zoneEnd);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>Tocá en la zona verde</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.zone,
            { left: `${zoneStart * 100}%`, width: `${(zoneEnd - zoneStart) * 100}%` },
          ]}
        />
        <View style={[styles.needle, { left: `${pos * 100}%` }]} />
      </View>
      <Pressable onPress={tap} style={styles.btn}>
        <Text style={styles.btnText}>AHORA</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: tones.danger.border,
    backgroundColor: colors.bgCard,
  },
  label: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 },
  hint: { color: colors.muted, fontFamily: fonts.body, fontSize: 12 },
  track: {
    height: 14,
    backgroundColor: colors.bgSunken,
    overflow: 'hidden',
    position: 'relative',
  },
  zone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(80,220,160,0.35)',
  },
  needle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    marginLeft: -1.5,
    backgroundColor: colors.danger,
  },
  btn: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: tones.danger.fg,
  },
  btnText: {
    color: colors.onAccent,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 1.2,
  },
});
