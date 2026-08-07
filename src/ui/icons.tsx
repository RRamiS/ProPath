import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from './theme';

export type IconName =
  | 'soloq'
  | 'scrim'
  | 'vod'
  | 'rest'
  | 'content'
  | 'match'
  | 'conditioning'
  | 'physio'
  | 'hangout'
  | 'trophy'
  | 'spark';

type Props = {
  name: IconName;
  color?: string;
  size?: number;
};

/**
 * Glifos dibujados con Views: nítidos en web y nativo, sin dependencia de
 * fuentes de iconos ni emoji (que rompen el look en distintos SO).
 */
export function Icon({ name, color = colors.accent, size = 20 }: Props) {
  const box: ViewStyle = { width: size, height: size };
  const u = size / 20;

  switch (name) {
    case 'soloq':
      return (
        <View style={[box, styles.center]}>
          <View
            style={[
              styles.bar,
              {
                width: size * 0.62,
                height: 2.4 * u,
                backgroundColor: color,
                transform: [{ translateX: -size * 0.15 }, { rotate: '-45deg' }],
              },
            ]}
          />
          <View
            style={[
              styles.bar,
              {
                width: size * 0.62,
                height: 2.4 * u,
                backgroundColor: color,
                transform: [{ translateX: size * 0.15 }, { rotate: '45deg' }],
              },
            ]}
          />
        </View>
      );

    case 'conditioning':
    case 'scrim':
      return (
        <View style={[box, styles.center]}>
          <View
            style={[
              styles.dot,
              { width: 5.5 * u, height: 5.5 * u, backgroundColor: color, top: 0 },
            ]}
          />
          <View
            style={[
              styles.dot,
              { width: 5.5 * u, height: 5.5 * u, backgroundColor: color, bottom: 1 * u, left: 0 },
            ]}
          />
          <View
            style={[
              styles.dot,
              { width: 5.5 * u, height: 5.5 * u, backgroundColor: color, bottom: 1 * u, right: 0 },
            ]}
          />
        </View>
      );

    case 'vod':
      return (
        <View style={[box, styles.center]}>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 11 * u,
              borderTopWidth: 7 * u,
              borderBottomWidth: 7 * u,
              borderLeftColor: color,
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
              marginLeft: 3 * u,
            }}
          />
        </View>
      );

    case 'physio':
    case 'rest':
      return (
        <View style={[box, styles.centerRow]}>
          <View
            style={[
              styles.bar,
              { position: 'relative', width: 4 * u, height: 13 * u, backgroundColor: color },
            ]}
          />
          <View
            style={[
              styles.bar,
              {
                position: 'relative',
                width: 4 * u,
                height: 13 * u,
                backgroundColor: color,
                marginLeft: 4 * u,
              },
            ]}
          />
        </View>
      );

    case 'hangout':
    case 'content':
      return (
        <View style={[box, styles.centerRowBottom]}>
          {[6, 10, 15].map((h, i) => (
            <View
              key={h}
              style={[
                styles.bar,
                {
                  position: 'relative',
                  width: 3.4 * u,
                  height: h * u,
                  backgroundColor: color,
                  marginLeft: i === 0 ? 0 : 2.6 * u,
                  opacity: 0.55 + i * 0.22,
                },
              ]}
            />
          ))}
        </View>
      );

    case 'match':
      return (
        <View style={[box, styles.center]}>
          <View
            style={[
              styles.bar,
              {
                width: size * 0.9,
                height: 2.6 * u,
                backgroundColor: color,
                transform: [{ rotate: '45deg' }],
              },
            ]}
          />
          <View
            style={[
              styles.bar,
              {
                width: size * 0.9,
                height: 2.6 * u,
                backgroundColor: color,
                transform: [{ rotate: '-45deg' }],
              },
            ]}
          />
        </View>
      );

    case 'trophy':
      return (
        <View style={[box, styles.centerColumn]}>
          <View
            style={{
              width: 12 * u,
              height: 9 * u,
              borderBottomLeftRadius: 9 * u,
              borderBottomRightRadius: 9 * u,
              backgroundColor: color,
            }}
          />
          <View style={{ width: 3 * u, height: 4 * u, backgroundColor: color }} />
          <View style={{ width: 11 * u, height: 2.4 * u, borderRadius: 2, backgroundColor: color }} />
        </View>
      );

    case 'spark':
    default:
      return (
        <View style={[box, styles.center]}>
          <View
            style={[
              styles.bar,
              { width: size * 0.78, height: 2.2 * u, backgroundColor: color },
            ]}
          />
          <View
            style={[
              styles.bar,
              {
                width: size * 0.78,
                height: 2.2 * u,
                backgroundColor: color,
                transform: [{ rotate: '90deg' }],
              },
            ]}
          />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  centerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  centerRowBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  centerColumn: { alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', borderRadius: 99 },
  dot: { position: 'absolute', borderRadius: 99 },
});
