import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MobaBackdrop } from './MobaBackdrop';
import {
  colors,
  fonts,
  maxContentWidth,
  radius,
  SKEW,
  space,
  tones,
  UNSKEW,
  type Tone,
} from './theme';
import { useGameStore, type CinematicPayload } from '../store/gameStore';

const fill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

const VIBE: Record<CinematicPayload['vibe'], { label: string; tone: Tone }> = {
  kickoff: { label: 'NUEVA CARRERA', tone: 'accent' },
  promote: { label: 'PROMOCIÓN', tone: 'gold' },
  skill: { label: 'SKILL CHECK', tone: 'violet' },
  ending: { label: 'FINAL DE TEMPORADA', tone: 'gold' },
  match: { label: 'MATCH DAY', tone: 'danger' },
};

export function CinematicOverlay() {
  const cinematic = useGameStore((s) => s.cinematic);
  const dismiss = useGameStore((s) => s.dismissCinematic);

  const visible = useSharedValue(0);
  const titleY = useSharedValue(24);
  const bars = useSharedValue(0);
  const parallax = useSharedValue(0);
  const glitch = useSharedValue(0);

  const [beatIndex, setBeatIndex] = useState(0);

  const beats = cinematic?.beats ?? [];
  const hasBeats = beats.length > 0;
  const isLastBeat = beatIndex >= beats.length - 1;

  useEffect(() => {
    setBeatIndex(0);
  }, [cinematic]);

  useEffect(() => {
    if (!cinematic) {
      visible.value = 0;
      bars.value = 0;
      return;
    }

    visible.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    bars.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    titleY.value = withSequence(
      withTiming(24, { duration: 0 }),
      withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) })
    );

    parallax.value = 0;
    parallax.value = withTiming(1, { duration: 6000, easing: Easing.out(Easing.quad) });

    if (cinematic.vibe === 'match' || cinematic.vibe === 'ending') {
      glitch.value = withDelay(
        260,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 55 }),
            withTiming(0, { duration: 55 }),
            withTiming(0, { duration: 900 })
          ),
          -1,
          false
        )
      );
    } else {
      glitch.value = 0;
    }

    // Con beats el jugador marca el ritmo; sin beats, autocierra.
    const auto =
      cinematic.beats?.length || cinematic.vibe === 'ending'
        ? null
        : (cinematic.durationMs ?? 2600);
    if (auto == null) return;

    const id = setTimeout(() => {
      visible.value = withTiming(0, { duration: 380 }, (done) => {
        if (done) runOnJS(dismiss)();
      });
    }, auto);
    return () => clearTimeout(id);
  }, [cinematic, dismiss, titleY, visible, bars, parallax, glitch]);

  const wrapStyle = useAnimatedStyle(() => ({ opacity: visible.value }));

  const backdropStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(parallax.value, [0, 1], [1.12, 1]) },
      { translateY: interpolate(parallax.value, [0, 1], [14, -10]) },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: visible.value,
    transform: [
      { translateY: titleY.value },
      { translateX: interpolate(glitch.value, [0, 1], [0, -3]) },
    ],
  }));

  const glitchGhost = useAnimatedStyle(() => ({
    opacity: glitch.value * 0.75,
    transform: [{ translateX: interpolate(glitch.value, [0, 1], [0, 4]) }],
  }));

  const ruleStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(visible.value, [0, 1], [0.15, 1]) }],
    opacity: visible.value,
  }));

  const barTop = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(bars.value, [0, 1], [-70, 0]) }],
  }));

  const barBottom = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(bars.value, [0, 1], [70, 0]) }],
  }));

  if (!cinematic) return null;

  const vibe = VIBE[cinematic.vibe];
  const t = tones[vibe.tone];

  const advance = () => {
    if (hasBeats && !isLastBeat) {
      setBeatIndex((i) => i + 1);
      return;
    }
    dismiss();
  };

  const line = hasBeats ? beats[beatIndex] : cinematic.subtitle;

  return (
    <Animated.View style={[fill, styles.root, wrapStyle]} pointerEvents="auto">
      <Animated.View style={[fill, backdropStyle]}>
        <MobaBackdrop intensity="cinematic" showArt />
      </Animated.View>
      <View style={[fill, styles.veil]} />

      <Animated.View style={[styles.letterbox, styles.letterboxTop, barTop]}>
        <View style={[styles.letterboxEdge, { backgroundColor: t.fg }]} />
      </Animated.View>
      <Animated.View style={[styles.letterbox, styles.letterboxBottom, barBottom]}>
        <View style={[styles.letterboxEdge, styles.letterboxEdgeBottom, { backgroundColor: t.fg }]} />
      </Animated.View>

      <Pressable style={styles.tapLayer} onPress={advance}>
        <View style={styles.content}>
          <View style={[styles.kickerTab, { backgroundColor: t.fg }]}>
            <Text style={styles.kickerText}>{vibe.label}</Text>
          </View>

          <View>
            <Animated.Text
              style={[styles.title, styles.titleGhost, { color: t.fg }, glitchGhost]}
              numberOfLines={3}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {cinematic.title}
            </Animated.Text>
            <Animated.Text style={[styles.title, titleStyle]} numberOfLines={3}>
              {cinematic.title}
            </Animated.Text>
          </View>

          {line ? <Text style={styles.subtitle}>{line}</Text> : null}

          <Animated.View style={[styles.rule, { backgroundColor: t.fg }, ruleStyle]} />

          {hasBeats ? (
            <View style={styles.beatDots}>
              {beats.map((b, i) => (
                <View
                  key={b}
                  style={[
                    styles.beatDot,
                    { backgroundColor: i <= beatIndex ? t.fg : colors.lineStrong },
                  ]}
                />
              ))}
            </View>
          ) : null}

          {cinematic.vibe === 'ending' && (!hasBeats || isLastBeat) ? (
            <View style={[styles.cta, { backgroundColor: t.fg }]}>
              <Text style={styles.ctaText}>Ver resultado</Text>
            </View>
          ) : (
            <Text style={styles.skipHint}>
              {hasBeats && !isLastBeat ? 'Tocá para continuar' : 'Tocá para saltar'}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    justifyContent: 'center',
    zIndex: 80,
  },
  veil: {
    backgroundColor: 'rgba(3,5,8,0.66)',
  },
  tapLayer: {
    ...fill,
    justifyContent: 'center',
  },
  letterbox: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 52,
    backgroundColor: colors.bgSunken,
  },
  letterboxTop: { top: 0 },
  letterboxBottom: { bottom: 0 },
  letterboxEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.5,
    opacity: 0.5,
  },
  letterboxEdgeBottom: { bottom: undefined, top: 0 },
  content: {
    paddingHorizontal: space.lg,
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
  },
  kickerTab: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    marginBottom: 16,
    transform: [{ skewX: SKEW }],
  },
  kickerText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2.2,
    transform: [{ skewX: UNSKEW }],
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1.6,
    textTransform: 'uppercase',
    maxWidth: 460,
  },
  titleGhost: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 400,
    marginTop: 12,
    marginBottom: 18,
  },
  rule: {
    height: 3,
    width: 110,
    marginBottom: 20,
  },
  beatDots: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 18,
  },
  beatDot: { width: 18, height: 3 },
  cta: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: radius.md,
  },
  ctaText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  skipHint: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
});
