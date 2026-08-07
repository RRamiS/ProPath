/**
 * Minijuego: tocá cuando el marcador está en la zona verde.
 * Aguja con Reanimated (60fps); no usa setInterval/setState por frame.
 */
import { useEffect, useRef } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, tones } from './theme';

export function TapWindow({
  label,
  onDone,
  /** Ida+vuelta completa (ms). Más alto = más legible. */
  durationMs = 2800,
  /** Semi-ancho de la zona buena (0.16 ≈ 32% del track). */
  zoneHalf = 0.16,
}: {
  label: string;
  onDone: (success: boolean) => void;
  durationMs?: number;
  zoneHalf?: number;
}) {
  const done = useRef(false);
  const progress = useSharedValue(0);
  const trackW = useSharedValue(0);
  const zoneStart = Math.max(0.08, 0.5 - zoneHalf);
  const zoneEnd = Math.min(0.92, 0.5 + zoneHalf);

  useEffect(() => {
    const half = Math.max(900, durationMs / 2);
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: half, easing: Easing.linear }),
      -1,
      true
    );
    // Varias pasadas; si no tocan, falla.
    const miss = setTimeout(() => {
      if (done.current) return;
      done.current = true;
      cancelAnimation(progress);
      onDone(false);
    }, half * 5);
    return () => {
      cancelAnimation(progress);
      clearTimeout(miss);
    };
  }, [durationMs, onDone, progress]);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackW.value = e.nativeEvent.layout.width;
  };

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * Math.max(0, trackW.value - 4) }],
  }));

  const tap = () => {
    if (done.current) return;
    done.current = true;
    const p = progress.value;
    cancelAnimation(progress);
    onDone(p >= zoneStart && p <= zoneEnd);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>Tocá AHORA cuando la barra esté en verde</Text>
      <View style={styles.track} onLayout={onTrackLayout}>
        <View
          style={[
            styles.zone,
            {
              left: `${zoneStart * 100}%`,
              width: `${(zoneEnd - zoneStart) * 100}%`,
            },
          ]}
        />
        <Animated.View style={[styles.needle, needleStyle]} />
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
    height: 18,
    backgroundColor: colors.bgSunken,
    overflow: 'hidden',
    position: 'relative',
  },
  zone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(80,220,160,0.4)',
  },
  needle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: colors.danger,
  },
  btn: {
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    backgroundColor: tones.danger.fg,
  },
  btnText: {
    color: colors.onAccent,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 1.2,
  },
});
