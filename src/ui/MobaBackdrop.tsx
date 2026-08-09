import { useEffect } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
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
import { stageGradient, stageTone, tones } from './theme';

type Props = {
  intensity?: 'landing' | 'play' | 'cinematic';
  showArt?: boolean;
  /** Etapa de carrera (o 'arena' durante un partido) para teñir la escena */
  stageId?: string;
};

const fill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

function Lane({
  rotate,
  delay,
  width,
  height,
  color,
}: {
  rotate: string;
  delay: number;
  width: number;
  height: number;
  color: string;
}) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, [delay, pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.14, 0.4]),
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
          backgroundColor: color,
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
  color,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
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
    opacity: interpolate(t.value, [0, 0.5, 1], [0.12, 0.8, 0.18]),
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
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

/** Piso de arena en perspectiva: líneas que se abren hacia abajo. */
function GridFloor({ width, height, color }: { width: number; height: number; color: string }) {
  const lines = Array.from({ length: 9 }).map((_, i) => {
    const t = (i + 1) / 10;
    return {
      top: height * (0.58 + Math.pow(t, 1.9) * 0.42),
      opacity: 0.04 + t * 0.1,
    };
  });

  return (
    <View style={fill} pointerEvents="none">
      {lines.map((l, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            width,
            top: l.top,
            height: 1,
            backgroundColor: color,
            opacity: l.opacity,
          }}
        />
      ))}
    </View>
  );
}

/** Barrido de escaneo: un solo elemento, mucha sensación de broadcast. */
function ScanSweep({ height, color }: { height: number; color: string }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
  }, [t]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(t.value, [0, 1], [-40, height + 40]) }],
    opacity: interpolate(t.value, [0, 0.1, 0.9, 1], [0, 0.5, 0.5, 0]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: color,
          opacity: 0.25,
        },
        style,
      ]}
    />
  );
}

function Nexus({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [t]);

  const core = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(t.value, [0, 1], [0.92, 1.08]) }],
    opacity: interpolate(t.value, [0, 1], [0.45, 0.85]),
  }));

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(t.value, [0, 1], [1, 1.35]) }],
    opacity: interpolate(t.value, [0, 1], [0.3, 0]),
  }));

  return (
    <View style={{ position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2 }}>
      <Animated.View
        style={[{ ...fill, borderRadius: 999, borderWidth: 2, borderColor: color }, ring]}
      />
      <Animated.View
        style={[
          { ...fill, borderRadius: 999, borderWidth: 2, borderColor: color, opacity: 0.7 },
          core,
        ]}
      />
    </View>
  );
}

export function MobaBackdrop({ intensity = 'play', showArt = false, stageId }: Props) {
  const { width, height } = useWindowDimensions();
  const fog = useSharedValue(0);
  const isLanding = intensity === 'landing' || intensity === 'cinematic';

  const key = stageId ?? (isLanding ? 'landing' : 'soloq');
  const gradient = stageGradient[key] ?? stageGradient.soloq!;
  const accent = tones[stageTone[key] ?? (key === 'arena' ? 'danger' : 'accent')].fg;

  useEffect(() => {
    fog.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [fog]);

  const fogStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fog.value, [0, 1], [0.02, 0.045]),
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
      <LinearGradient colors={gradient} style={fill} />

      {showArt ? (
        <Image
          source={require('../../assets/moba-landing-bg.jpg')}
          style={[fill, { width: '100%', height: '100%', opacity: isLanding ? 0.28 : 0.14 }]}
          resizeMode="cover"
        />
      ) : null}

      <GridFloor width={width} height={height} color={accent} />

      <Lane rotate="-32deg" delay={0} width={width} height={height} color={accent} />
      <Lane rotate="0deg" delay={200} width={width} height={height} color={accent} />
      <Lane rotate="32deg" delay={400} width={width} height={height} color={accent} />

      <Nexus cx={width * 0.78} cy={height * 0.28} r={isLanding ? 42 : 28} color={accent} />
      <Nexus cx={width * 0.18} cy={height * 0.72} r={isLanding ? 28 : 18} color={accent} />

      <ScanSweep height={height} color={accent} />

      {sparks.map((s, i) => (
        <Spark key={i} {...s} color={accent} />
      ))}

      <Animated.View
        style={[
          {
            position: 'absolute',
            width: width * 1.6,
            height: height * 0.6,
            top: height * 0.18,
            left: -width * 0.3,
            backgroundColor: accent,
            opacity: 0.035,
          },
          fogStyle,
        ]}
      />

      {/* Velo de lectura: el arte tiene que ser atmósfera, no competencia. */}
      <LinearGradient
        colors={['rgba(4,6,9,0.72)', 'rgba(4,6,9,0.52)', 'rgba(4,6,9,0.96)']}
        locations={[0, 0.45, 1]}
        style={fill}
      />

      <View style={[styles.corner, styles.cornerTL, { borderColor: accent }]} />
      <View style={[styles.corner, styles.cornerBR, { borderColor: accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    opacity: 0.45,
  },
  cornerTL: {
    top: 14,
    left: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
});
