/**
 * Diorama de arena para el partido en vivo.
 * Misma cámara/assets que las habitaciones; actores y tintes reaccionan a fase e impulso.
 */
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { MatchPhase } from './simulate';
import { IsoRoom } from '../room/IsoRoom';
import { floorToScreen, venueLayout, type PropId } from '../room/layout';
import { roomPropArt } from '../room/roomArt';
import { WorldActor } from '../room/WorldActor';
import { LiveDot } from '../ui/components';
import { colors, fonts, SKEW, UNSKEW } from '../ui/theme';

const ARENA_PROPS: PropId[] = ['banner', 'board', 'tv', 'rig', 'cam', 'rug', 'door', 'window'];

const PHASE_FOCUS: Record<MatchPhase, PropId> = {
  draft: 'board',
  early: 'rig',
  fight: 'cam',
  late: 'tv',
};

export function ArenaScene({
  phase,
  momentum,
  playerName,
  opponent,
  won,
  night = false,
}: {
  phase: MatchPhase;
  /** 0–100 shared value from LiveMatch */
  momentum: SharedValue<number>;
  playerName: string;
  opponent: string;
  /** null = en vivo; true/false = resultado */
  won?: boolean | null;
  night?: boolean;
}) {
  const layout = venueLayout('arena');
  const focusId = PHASE_FOCUS[phase] ?? 'rig';
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  // Impulso alto → jugador avanza al centro; rival cede terreno.
  const push = useSharedValue(0);
  useEffect(() => {
    // Leemos el shared value en cada frame vía animated style, no acá.
  }, []);

  const playerPush = useAnimatedStyle(() => {
    const m = (momentum.value - 50) / 50; // -1..1
    return { transform: [{ translateX: m * 10 }] };
  });
  const rivalPush = useAnimatedStyle(() => {
    const m = (momentum.value - 50) / 50;
    return { transform: [{ translateX: m * 10 }] };
  });

  const ringAnim = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.45,
    transform: [{ scale: 0.92 + pulse.value * 0.1 }],
  }));

  const playerFloor = floorToScreen('arena', -2.4, -1.6);
  const rivalFloor = floorToScreen('arena', 2.6, -1.4);
  const focusSpec = layout.all.find((p) => p.id === focusId);
  const focusFloor = focusSpec
    ? floorToScreen('arena', focusSpec.fx, focusSpec.fy)
    : null;

  const resultWash =
    won === true
      ? (['rgba(80,220,120,0.28)', 'rgba(8,20,12,0.1)'] as const)
      : won === false
        ? (['rgba(255,60,90,0.32)', 'rgba(20,6,10,0.14)'] as const)
        : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.sceneClip}>
      <IsoRoom venueId="arena" night={night} dim={false}>
        {layout.all
          .filter((p) => ARENA_PROPS.includes(p.id))
          .map((spec) => {
            const source = roomPropArt('arena', spec.id);
            if (!source) return null;
            const focused = spec.id === focusId && won == null;
            return (
              <View
                key={spec.id}
                pointerEvents="none"
                style={[
                  styles.prop,
                  {
                    left: `${spec.left}%`,
                    top: `${spec.top}%`,
                    width: `${spec.width}%`,
                    height: `${spec.height}%`,
                    zIndex: spec.z,
                    opacity: focused ? 1 : 0.72,
                  },
                ]}
              >
                <Image source={source} style={styles.fill} contentFit="fill" />
                {focused ? (
                  <Image
                    source={source}
                    style={[styles.fill, { opacity: 0.22 }]}
                    contentFit="fill"
                    tintColor={colors.danger}
                  />
                ) : null}
              </View>
            );
          })}

        {focusFloor && won == null ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.focusRing,
              {
                left: `${focusFloor.x}%`,
                top: `${focusFloor.y}%`,
              },
              ringAnim,
            ]}
          />
        ) : null}

        <Animated.View style={[styles.actorLayer, playerPush]} pointerEvents="none">
          <WorldActor
            x={playerFloor.x}
            y={playerFloor.y}
            kind="player"
            label={playerName.slice(0, 8)}
            tone="accent"
            isPlayer
          />
        </Animated.View>
        <Animated.View style={[styles.actorLayer, rivalPush]} pointerEvents="none">
          <WorldActor
            x={rivalFloor.x}
            y={rivalFloor.y}
            kind="rival"
            label={opponent.slice(0, 10)}
            tone="danger"
          />
        </Animated.View>

        {resultWash ? (
          <LinearGradient colors={[...resultWash]} style={styles.wash} pointerEvents="none" />
        ) : null}
      </IsoRoom>
      </View>

      <View style={styles.hud} pointerEvents="none">
        <View style={styles.liveTag}>
          <LiveDot tone="danger" size={6} />
          <Text style={styles.liveTagText}>
            {won == null ? 'EN VIVO' : won ? 'WIN' : 'LOSS'}
          </Text>
        </View>
        <Text style={styles.phaseHud}>{phaseLabel(phase)}</Text>
        <Text style={styles.network}>ARENA</Text>
      </View>

      <View style={styles.vsStrip} pointerEvents="none">
        <Text style={styles.vsUs} numberOfLines={1}>
          {playerName}
        </Text>
        <Text style={styles.vsMark}>VS</Text>
        <Text style={styles.vsThem} numberOfLines={1}>
          {opponent}
        </Text>
      </View>
    </View>
  );
}

function phaseLabel(phase: MatchPhase): string {
  if (phase === 'draft') return 'DRAFT';
  if (phase === 'early') return 'EARLY';
  if (phase === 'fight') return 'FIGHT';
  return 'CIERRE';
}

const FILL = { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 };

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.35)',
    overflow: 'hidden',
    backgroundColor: colors.bgSunken,
  },
  sceneClip: {
    width: '100%',
    height: 248,
    overflow: 'hidden',
  },
  prop: { position: 'absolute' },
  fill: { width: '100%', height: '100%' },
  actorLayer: { ...FILL, zIndex: 30 },
  wash: { ...FILL, zIndex: 35 },
  focusRing: {
    position: 'absolute',
    width: '12%',
    height: '6%',
    marginLeft: '-6%',
    marginTop: '-3%',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.danger,
    backgroundColor: 'rgba(255,59,92,0.18)',
    zIndex: 2,
  },
  hud: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 40,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,59,92,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    transform: [{ skewX: SKEW }],
  },
  liveTagText: {
    color: colors.danger,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.6,
    transform: [{ skewX: UNSKEW }],
  },
  phaseHud: {
    marginLeft: 8,
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  network: {
    marginLeft: 'auto',
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 2,
  },
  vsStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(4,6,12,0.78)',
    zIndex: 40,
  },
  vsUs: {
    flex: 1,
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  vsMark: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    marginHorizontal: 8,
  },
  vsThem: {
    flex: 1,
    color: colors.danger,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textAlign: 'right',
  },
});
