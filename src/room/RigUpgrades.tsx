/**
 * Capas visuales del setup encima del prop `rig`.
 * Lo que comprás en la shop se ve: monitores, silla, RGB, teclado.
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../ui/theme';

export type RigUpgradeFlags = {
  monitor?: boolean;
  chair?: boolean;
  glow?: boolean;
  desk?: boolean;
};

export function RigUpgrades({
  monitor,
  chair,
  glow,
  desk,
}: RigUpgradeFlags) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!glow && !monitor) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [glow, monitor, pulse]);

  const glowAnim = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.45,
  }));
  const screenAnim = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.35,
  }));

  if (!monitor && !chair && !glow && !desk) return null;

  return (
    <View style={styles.root} pointerEvents="none">
      {monitor ? (
        <>
          <Animated.View style={[styles.monitorL, screenAnim]}>
            <LinearGradient
              colors={['rgba(80,220,255,0.85)', 'rgba(30,120,200,0.55)', 'rgba(10,40,80,0.2)']}
              style={styles.fill}
            />
          </Animated.View>
          <Animated.View style={[styles.monitorR, screenAnim]}>
            <LinearGradient
              colors={['rgba(90,230,255,0.8)', 'rgba(40,140,210,0.5)', 'rgba(10,40,80,0.15)']}
              style={styles.fill}
            />
          </Animated.View>
          <View style={styles.ultrawideBezel} />
        </>
      ) : null}

      {desk ? (
        <>
          <View style={styles.keyboard}>
            <LinearGradient
              colors={['rgba(220,230,240,0.55)', 'rgba(40,50,70,0.35)']}
              style={styles.fill}
            />
          </View>
          <View style={styles.kbGlow}>
            <LinearGradient
              colors={['rgba(160,255,80,0.0)', 'rgba(160,255,80,0.7)', 'rgba(160,255,80,0.0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.fill}
            />
          </View>
        </>
      ) : null}

      {chair ? (
        <>
          <View style={styles.chairBack}>
            <LinearGradient
              colors={['rgba(20,24,32,0.55)', 'rgba(12,14,20,0.15)']}
              style={styles.fill}
            />
          </View>
          <View style={styles.chairStripe}>
            <LinearGradient
              colors={['rgba(180,255,60,0.95)', 'rgba(100,200,40,0.4)']}
              style={styles.fill}
            />
          </View>
        </>
      ) : null}

      {glow ? (
        <>
          <Animated.View style={[styles.towerRgb, glowAnim]}>
            <LinearGradient
              colors={[colors.accent, 'rgba(80,220,255,0.8)', colors.accent]}
              style={styles.fill}
            />
          </Animated.View>
          <Animated.View style={[styles.deskWash, glowAnim]}>
            <LinearGradient
              colors={['rgba(120,255,80,0.0)', 'rgba(120,255,80,0.28)', 'rgba(120,255,80,0.0)']}
              style={styles.fill}
            />
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

const FILL = { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 };

const styles = StyleSheet.create({
  root: { ...FILL, zIndex: 2 },
  fill: { flex: 1 },

  // Monitores ultrawide: zona superior del rig
  monitorL: {
    position: 'absolute',
    left: '18%',
    top: '6%',
    width: '28%',
    height: '22%',
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(180,240,255,0.55)',
  },
  monitorR: {
    position: 'absolute',
    left: '48%',
    top: '4%',
    width: '30%',
    height: '24%',
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(180,240,255,0.5)',
  },
  ultrawideBezel: {
    position: 'absolute',
    left: '16%',
    top: '4%',
    width: '64%',
    height: '28%',
    borderWidth: 1.5,
    borderColor: 'rgba(200,240,255,0.35)',
    borderRadius: 3,
  },

  keyboard: {
    position: 'absolute',
    left: '28%',
    top: '48%',
    width: '34%',
    height: '8%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  kbGlow: {
    position: 'absolute',
    left: '26%',
    top: '54%',
    width: '38%',
    height: '4%',
  },

  chairBack: {
    position: 'absolute',
    left: '8%',
    top: '42%',
    width: '18%',
    height: '38%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  chairStripe: {
    position: 'absolute',
    left: '14%',
    top: '44%',
    width: '5%',
    height: '32%',
    borderRadius: 2,
    overflow: 'hidden',
  },

  towerRgb: {
    position: 'absolute',
    right: '10%',
    top: '28%',
    width: '5%',
    height: '42%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  deskWash: {
    position: 'absolute',
    left: '20%',
    top: '38%',
    width: '55%',
    height: '18%',
  },
});
