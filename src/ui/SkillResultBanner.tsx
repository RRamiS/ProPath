import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, springs, tones } from './theme';

/** Flash corto LIMPIO / FALLASTE después de un skill check. */
export function SkillResultBanner({ ok }: { ok: boolean }) {
  const pop = useSharedValue(0);

  useEffect(() => {
    pop.value = withSequence(
      withTiming(0, { duration: 0 }),
      withSpring(1, springs.bouncy),
      withTiming(1, { duration: 280 }),
      withTiming(0.92, { duration: 120 })
    );
  }, [pop, ok]);

  const style = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.86 + pop.value * 0.14 }],
  }));

  const tone = ok ? tones.accent : tones.danger;

  return (
    <Animated.View style={[styles.wrap, { borderColor: tone.border, backgroundColor: tone.bg }, style]}>
      <View style={[styles.edge, { backgroundColor: tone.fg }]} />
      <Text style={[styles.kicker, { color: tone.fg }]}>{ok ? 'LIMPIO' : 'FALLASTE'}</Text>
      <Text style={styles.body}>
        {ok ? 'El play entra. El impulso es tuyo.' : 'Se rompió. La presión rival sube.'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    padding: 14,
    paddingLeft: 16,
    gap: 4,
    overflow: 'hidden',
  },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 2,
  },
  body: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
});
