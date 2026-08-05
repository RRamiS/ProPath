import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MobaBackdrop } from './MobaBackdrop';
import { colors, fonts, space } from './theme';
import { useGameStore, type CinematicPayload } from '../store/gameStore';

const fill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

const VIBE_LABEL: Record<CinematicPayload['vibe'], string> = {
  kickoff: 'NUEVA CARRERA',
  promote: 'PROMOCIÓN',
  skill: 'SKILL CHECK',
  ending: 'FINAL DE TEMPORADA',
  match: 'MATCH DAY',
};

export function CinematicOverlay() {
  const cinematic = useGameStore((s) => s.cinematic);
  const dismiss = useGameStore((s) => s.dismissCinematic);
  const visible = useSharedValue(0);
  const titleY = useSharedValue(24);

  useEffect(() => {
    if (!cinematic) {
      visible.value = 0;
      return;
    }
    visible.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    titleY.value = withSequence(
      withTiming(24, { duration: 0 }),
      withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) })
    );

    const auto = cinematic.vibe !== 'ending' ? cinematic.durationMs ?? 2600 : null;
    if (auto == null) return;

    const id = setTimeout(() => {
      visible.value = withTiming(0, { duration: 380 }, (done) => {
        if (done) runOnJS(dismiss)();
      });
    }, auto);
    return () => clearTimeout(id);
  }, [cinematic, dismiss, titleY, visible]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: visible.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: visible.value,
    transform: [{ translateY: titleY.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(visible.value, [0, 1], [0.2, 1]) }],
    opacity: visible.value,
  }));

  if (!cinematic) return null;

  return (
    <Animated.View style={[fill, styles.root, wrapStyle]} pointerEvents="auto">
      <MobaBackdrop intensity="cinematic" showArt />
      <View style={[fill, styles.veil]} />
      <View style={styles.content}>
        <Text style={styles.kicker}>{VIBE_LABEL[cinematic.vibe]}</Text>
        <Animated.Text style={[styles.title, titleStyle]}>{cinematic.title}</Animated.Text>
        {cinematic.subtitle ? <Text style={styles.subtitle}>{cinematic.subtitle}</Text> : null}
        <Animated.View style={[styles.bar, barStyle]} />
        {cinematic.vibe === 'ending' ? (
          <Pressable style={styles.skip} onPress={dismiss}>
            <Text style={styles.skipText}>Continuar</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.skipGhost} onPress={dismiss}>
            <Text style={styles.skipGhostText}>Saltar</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    justifyContent: 'center',
    zIndex: 80,
  },
  veil: {
    backgroundColor: 'rgba(2,6,10,0.55)',
  },
  content: {
    paddingHorizontal: space.lg,
    alignItems: 'flex-start',
  },
  kicker: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2.4,
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 360,
    marginBottom: 18,
  },
  bar: {
    height: 3,
    width: 120,
    backgroundColor: colors.accent,
    borderRadius: 99,
    marginBottom: 22,
  },
  skip: {
    backgroundColor: colors.accent,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  skipText: {
    color: '#04140E',
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  skipGhost: {
    paddingVertical: 8,
  },
  skipGhostText: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
});
