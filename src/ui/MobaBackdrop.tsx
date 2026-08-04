import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from './theme';

type Props = {
  intensity?: 'landing' | 'play' | 'cinematic';
  showArt?: boolean;
};

const fill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

function Lane({
  rotate,
  delay,
  width,
  height,
}: {
  rotate: string;
  delay: number;
  width: number;
  height: number;
}) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, [delay, pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.18, 0.45]),
    transform: [
      { translateX: width * 0.5 },
      { translateY: height * 0.55 },
      { rotate },
      { translateX: -width * 0.55 },
      { scaleX: interpolate(pulse.value, [0, 1], [0.96, 1.04]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: width * 1.2,
          height: 3,
          borderRadius: 99,
          backgroundColor: colors.accent,
        },
        style,
      ]}
    />
  );
}

function Spark({
  x,
  y,
  size,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2200 + delay * 0.3, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );
  }, [delay, t]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.5, 1], [0.15, 0.9, 0.2]),
    transform: [
      { translateY: interpolate(t.value, [0, 1], [0, -18]) },
      { scale: interpolate(t.value, [0, 1], [0.7, 1.2]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: 99,
          backgroundColor: colors.accent,
        },
        style,
      ]}
    />
  );
}

function Nexus({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t]);

  const core = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(t.value, [0, 1], [0.92, 1.08]) }],
    opacity: interpolate(t.value, [0, 1], [0.55, 0.95]),
  }));

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(t.value, [0, 1], [1, 1.35]) }],
    opacity: interpolate(t.value, [0, 1], [0.35, 0]),
  }));

  return (
    <View style={{ position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2 }}>
      <Animated.View
        style={[{ ...fill, borderRadius: 999, borderWidth: 2, borderColor: colors.accent }, ring]}
      />
      <Animated.View
        style={[
          {
            ...fill,
            borderRadius: 999,
            backgroundColor: 'rgba(61,220,151,0.22)',
            borderWidth: 2,
            borderColor: 'rgba(61,220,151,0.7)',
          },
          core,
        ]}
      />
    </View>
  );
}

export function MobaBackdrop({ intensity = 'play', showArt = false }: Props) {
  const { width, height } = useWindowDimensions();
  const fog = useSharedValue(0);
  const isLanding = intensity === 'landing' || intensity === 'cinematic';

  useEffect(() => {
    fog.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [fog]);

  const fogStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fog.value, [0, 1], [0.2, 0.45]),
    transform: [{ translateX: interpolate(fog.value, [0, 1], [-30, 30]) }],
  }));

  const sparks = [
    { x: width * 0.15, y: height * 0.3, size: 4, delay: 0 },
    { x: width * 0.72, y: height * 0.25, size: 5, delay: 200 },
    { x: width * 0.4, y: height * 0.55, size: 3, delay: 400 },
    { x: width * 0.85, y: height * 0.6, size: 4, delay: 600 },
    { x: width * 0.22, y: height * 0.7, size: 3, delay: 800 },
    { x: width * 0.55, y: height * 0.2, size: 4, delay: 1000 },
  ];

  return (
    <View style={fill} pointerEvents="none">
      <LinearGradient
        colors={isLanding ? ['#031018', '#071a14', '#05080C'] : ['#061018', colors.bg, '#04070A']}
        style={fill}
      />

      {showArt ? (
        <Image
          source={require('../../assets/moba-landing-bg.png')}
          style={[fill, { width: '100%', height: '100%', opacity: isLanding ? 0.5 : 0.22 }]}
          resizeMode="cover"
        />
      ) : null}

      <Lane rotate="-32deg" delay={0} width={width} height={height} />
      <Lane rotate="0deg" delay={200} width={width} height={height} />
      <Lane rotate="32deg" delay={400} width={width} height={height} />

      <Nexus cx={width * 0.78} cy={height * 0.28} r={isLanding ? 42 : 28} />
      <Nexus cx={width * 0.18} cy={height * 0.72} r={isLanding ? 28 : 18} />

      {sparks.map((s, i) => (
        <Spark key={i} {...s} />
      ))}

      <Animated.View
        style={[
          {
            position: 'absolute',
            width: width * 1.2,
            height: height * 0.5,
            top: height * 0.2,
            left: -width * 0.1,
            backgroundColor: 'rgba(61,220,151,0.06)',
            borderRadius: 999,
          },
          fogStyle,
        ]}
      />

      <LinearGradient
        colors={['rgba(4,7,10,0.2)', 'transparent', 'rgba(4,7,10,0.92)']}
        locations={[0, 0.4, 1]}
        style={fill}
      />

      <View style={[styles.cornerTL, !isLanding && { opacity: 0.45 }]} />
      <View style={[styles.cornerBR, !isLanding && { opacity: 0.45 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  cornerTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 32,
    height: 32,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(61,220,151,0.5)',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 32,
    height: 32,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(61,220,151,0.5)',
  },
});
