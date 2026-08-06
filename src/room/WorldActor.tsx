/**
 * Personaje sobre el piso iso. El tamaño y el punto de apoyo salen del mismo
 * render que la habitación, así el pie cae exactamente en la baldosa indicada.
 */
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { RelationKey } from '../engine/types';
import { colors, fonts, tones, type Tone } from '../ui/theme';
import { characterArt } from './artManifest';
import { CHAR_PLACEMENT } from './roomManifest.generated';

const FALLBACK = { w: 0.085, h: 0.158, footX: 0.5, footY: 0.81 };

export function WorldActor({
  x,
  y,
  label,
  kind,
  tone = 'accent',
  urgency = 0,
  bubble,
  isPlayer = false,
  onPress,
}: {
  /** Punto de apoyo en % de la escena */
  x: number;
  y: number;
  label?: string;
  kind?: 'player' | RelationKey;
  tone?: Tone;
  urgency?: number;
  bubble?: string | null;
  isPlayer?: boolean;
  onPress?: () => void;
}) {
  const ax = useSharedValue(x);
  const ay = useSharedValue(y);

  useEffect(() => {
    ax.value = withTiming(x, { duration: isPlayer ? 460 : 560 });
    ay.value = withTiming(y, { duration: isPlayer ? 460 : 560 });
  }, [x, y, ax, ay, isPlayer]);

  const spriteKey = isPlayer ? 'player' : kind;
  const place = (spriteKey && CHAR_PLACEMENT[spriteKey]) || FALLBACK;
  const w = place.w * 100;
  const h = place.h * 100;

  const style = useAnimatedStyle(() => ({
    left: `${ax.value - w * place.footX}%`,
    top: `${ay.value - h * place.footY}%`,
  }));

  const t = tones[tone];
  const sprite = spriteKey ? characterArt(spriteKey) : undefined;

  return (
    <Animated.View
      style={[styles.wrap, { width: `${w}%`, height: `${h}%` }, style]}
      pointerEvents={onPress ? 'box-none' : 'none'}
    >
      {sprite ? (
        <Image source={sprite} style={styles.sprite} contentFit="fill" />
      ) : (
        <View style={[styles.body, { borderColor: t.border }]}>
          <Text style={[styles.initial, { color: t.fg }]}>
            {(label ?? '?').slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}

      {urgency >= 50 ? (
        <View style={[styles.urgent, { backgroundColor: tones.danger.fg }]} pointerEvents="none" />
      ) : null}

      {label ? (
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      ) : null}

      {bubble ? (
        <View style={styles.bubble} pointerEvents="none">
          <Text style={styles.bubbleText} numberOfLines={2}>
            {bubble}
          </Text>
        </View>
      ) : null}

      {onPress ? (
        <Pressable
          onPress={onPress}
          style={styles.hit}
          accessibilityRole="button"
          accessibilityLabel={`Hablar con ${label ?? kind}`}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 30,
  },
  sprite: { width: '100%', height: '100%' },
  hit: { position: 'absolute', left: '-15%', right: '-15%', top: 0, bottom: 0 },
  body: {
    width: '100%',
    height: '100%',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  initial: { fontFamily: fonts.display, fontSize: 12 },
  label: {
    position: 'absolute',
    bottom: -11,
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  urgent: {
    position: 'absolute',
    top: '4%',
    right: '2%',
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  bubble: {
    position: 'absolute',
    top: -26,
    minWidth: 72,
    maxWidth: 118,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(8,10,16,0.92)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  bubbleText: { color: colors.text, fontFamily: fonts.body, fontSize: 8, lineHeight: 11 },
});
