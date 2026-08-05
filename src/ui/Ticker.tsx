import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, radius, tones, type Tone } from './theme';

/** Cinta de noticias de la escena, estilo broadcast. */
const GAP = 40;

export function Ticker({ items, tone = 'blue' }: { items: string[]; tone?: Tone }) {
  const shift = useSharedValue(0);
  const [lineWidth, setLineWidth] = useState(0);
  const t = tones[tone];

  // El loop tiene que recorrer exactamente el ancho de una copia + el hueco,
  // si no se ve el salto.
  useEffect(() => {
    if (lineWidth <= 0) return;
    const distance = lineWidth + GAP;
    shift.value = 0;
    shift.value = withRepeat(
      withTiming(distance, { duration: distance * 26, easing: Easing.linear }),
      -1,
      false
    );
  }, [items, lineWidth, shift]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -shift.value }],
  }));

  if (items.length === 0) return null;
  const line = items.join('   ·   ');

  return (
    <View style={[styles.wrap, { backgroundColor: t.bg, borderColor: t.border }]}>
      <View style={[styles.tag, { backgroundColor: t.fg }]}>
        <Text style={styles.tagText}>SCENE</Text>
      </View>
      <View style={styles.viewport}>
        <Animated.View style={[styles.track, style]}>
          <Text
            style={[styles.text, { color: t.fg }]}
            numberOfLines={1}
            onLayout={(e) => setLineWidth(e.nativeEvent.layout.width)}
          >
            {line}
          </Text>
          <Text style={[styles.text, { color: t.fg }]} numberOfLines={1}>
            {line}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
    height: 30,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    height: '100%',
    justifyContent: 'center',
  },
  tagText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    paddingLeft: 12,
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    flexShrink: 0,
  },
});
