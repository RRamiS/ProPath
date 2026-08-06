/**
 * Habitación isométrica compuesta: fondo renderizado en Blender + recortes de
 * props colocados con las coordenadas que exportó el mismo render, así todo
 * calza pixel-perfect y comparte escala.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { VenueId } from '../engine/types';
import { colors } from '../ui/theme';
import { roomBg } from './roomArt';
import { ROOM_ASPECT } from './roomManifest.generated';

export { ROOM_ASPECT };

export function IsoRoom({
  venueId,
  night = false,
  weather = 'clear',
  dim = false,
  children,
  style,
}: {
  venueId: VenueId;
  night?: boolean;
  weather?: string;
  /** Miniaturas (City/Shop): baja el contraste del ambiente */
  dim?: boolean;
  children?: ReactNode;
  style?: object;
}) {
  const tint = weatherTint(weather, night);

  return (
    <View style={[styles.root, style]}>
      <LinearGradient colors={['#070910', '#04050A']} style={StyleSheet.absoluteFill} />
      <Image source={roomBg(venueId)} style={StyleSheet.absoluteFill} contentFit="fill" />

      {/* Ambiente: la luz de la escena vive acá, no en cada prop */}
      <LinearGradient colors={tint} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {night ? <View style={styles.nightWash} pointerEvents="none" /> : null}

      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>

      {!dim ? (
        <LinearGradient
          colors={['rgba(4,6,11,0.5)', 'rgba(4,6,11,0)', 'rgba(4,6,11,0.55)']}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

function weatherTint(weather: string, night: boolean): [string, string] {
  if (night) return ['rgba(10,16,44,0.5)', 'rgba(4,6,16,0.34)'];
  switch (weather) {
    case 'rain':
      return ['rgba(24,44,86,0.34)', 'rgba(8,14,28,0.22)'];
    case 'heat':
      return ['rgba(96,52,20,0.26)', 'rgba(20,10,4,0.14)'];
    case 'fog':
      return ['rgba(78,88,102,0.34)', 'rgba(14,18,24,0.2)'];
    default:
      return ['rgba(28,34,52,0.14)', 'rgba(6,8,14,0.1)'];
  }
}

const FILL = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const;

const styles = StyleSheet.create({
  root: {
    width: '100%',
    aspectRatio: ROOM_ASPECT,
    overflow: 'hidden',
    backgroundColor: colors.bgSunken,
  },
  nightWash: {
    ...FILL,
    backgroundColor: 'rgba(6,10,26,0.22)',
  },
  content: FILL,
});
