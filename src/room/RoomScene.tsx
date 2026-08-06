/**
 * El diorama de la semana. La habitación es el menú: cada objeto es una acción.
 *
 * El fondo y los props salen del mismo render 3D, así que acá solo se resuelve
 * jerarquía (qué está vivo), interacción y quién está parado dónde.
 */
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { CareerState, ContentPack } from '../engine/types';
import { venueAllows } from '../engine/venues';
import { isMatchWeek, WEEK_ACTIVITIES, type WeekActivity } from '../engine/week';
import { colors, fonts, SKEW, tones, UNSKEW, type Tone } from '../ui/theme';
import { floorToScreen, standingSpot, venueLayout, type PropSpec } from './layout';
import { IsoRoom } from './IsoRoom';
import { roomPropArt } from './roomArt';
import { RigUpgrades } from './RigUpgrades';
import { hasVisual } from '../engine/economy';
import { npcSpawns, type NpcSpawn } from '../engine/venues';
import { WorldActor } from './WorldActor';

const ACTIVITY_TONE: Record<string, Tone> = {
  soloq: 'accent',
  scrim: 'blue',
  vod: 'violet',
  rest: 'gold',
  content: 'warn',
  match: 'danger',
};

export interface RoomSlot {
  spec: PropSpec;
  activity: WeekActivity;
  tone: Tone;
  available: boolean;
  lockLabel: string | null;
}

/** Qué objetos están vivos este bloque y por qué los otros no. */
export function roomSlots(career: CareerState, pack: ContentPack): RoomSlot[] {
  const order = pack.stages.find((s) => s.id === career.stageId)?.order ?? 1;
  const layout = venueLayout(career.venueId);
  return layout.actions
    .map((spec) => {
      const activity = WEEK_ACTIVITIES.find((a) => a.prop === spec.id);
      if (!activity) return null;

      const stageOk = (activity.minStageOrder ?? 0) <= order;
      const slotOk = activity.slots.includes(career.daypart);
      const fixtureOk = activity.id !== 'match' || isMatchWeek(career, pack);
      const venueOk = venueAllows(career.venueId, activity.id);

      let lockLabel: string | null = null;
      if (!stageOk) lockLabel = 'Bloqueado';
      else if (!venueOk) lockLabel = 'Otra sede';
      else if (!fixtureOk) lockLabel = 'Sin serie';
      else if (!slotOk) lockLabel = activity.slots.includes('night') ? 'De noche' : 'De día';

      return {
        spec,
        activity,
        tone: ACTIVITY_TONE[activity.id] ?? 'accent',
        available: stageOk && slotOk && fixtureOk && venueOk,
        lockLabel,
      };
    })
    .filter((x): x is RoomSlot => x !== null);
}

function boxOf(spec: PropSpec) {
  return {
    left: `${spec.left}%` as const,
    top: `${spec.top}%` as const,
    width: `${spec.width}%` as const,
    height: `${spec.height}%` as const,
    zIndex: spec.z,
  };
}

/**
 * Un prop. El tinte se pinta con una copia de la propia imagen (`tintColor`),
 * así el resaltado sigue la silueta y no dibuja un rectángulo.
 */
function RoomProp({
  venueId,
  spec,
  state,
  tone,
}: {
  venueId: CareerState['venueId'];
  spec: PropSpec;
  state: 'idle' | 'lit' | 'selected' | 'locked' | 'muted';
  tone: Tone;
}) {
  const source = roomPropArt(venueId, spec.id);
  if (!source) return null;
  const t = tones[tone];

  const baseOpacity =
    state === 'locked' ? 0.4 : state === 'muted' ? 0.62 : state === 'idle' ? 0.9 : 1;

  return (
    <View style={styles.fill} pointerEvents="none">
      <Image source={source} style={[styles.fill, { opacity: baseOpacity }]} contentFit="fill" />
      {state === 'locked' || state === 'muted' ? (
        <Image
          source={source}
          style={[styles.fill, { opacity: state === 'locked' ? 0.5 : 0.28 }]}
          contentFit="fill"
          tintColor="#050810"
        />
      ) : null}
      {state === 'lit' || state === 'selected' ? (
        <Image
          source={source}
          style={[styles.fill, { opacity: state === 'selected' ? 0.28 : 0.12 }]}
          contentFit="fill"
          tintColor={t.fg}
        />
      ) : null}
    </View>
  );
}

/** Marca en el piso bajo el objeto elegido. */
function FloorSpot({
  x,
  y,
  tone,
  on,
  size = 9,
}: {
  x: number;
  y: number;
  tone: Tone;
  on: boolean;
  size?: number;
}) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const anim = useAnimatedStyle(() => ({
    opacity: on ? 0.35 + pulse.value * 0.4 : 0,
    transform: [{ scale: 0.92 + pulse.value * 0.12 }],
  }));

  const t = tones[tone];
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.floorSpot,
        {
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}%`,
          height: `${size * 0.5}%`,
          marginLeft: `${-size / 2}%`,
          marginTop: `${(-size * 0.5) / 2}%`,
          borderColor: t.fg,
          backgroundColor: t.bg,
        },
        anim,
      ]}
    />
  );
}

export function RoomScene({
  career,
  pack,
  slots,
  selectedId,
  onSelect,
  onNpc,
  mode = 'week',
  highlightProp,
  walkTarget,
  onHighlightPress,
}: {
  career: CareerState;
  pack: ContentPack;
  slots: RoomSlot[];
  selectedId: string | null;
  onSelect: (slot: RoomSlot) => void;
  onNpc?: (npc: NpcSpawn) => void;
  mode?: 'week' | 'situation';
  highlightProp?: string | null;
  walkTarget?: { fx: number; fy: number } | null;
  onHighlightPress?: () => void;
}) {
  const order = pack.stages.find((s) => s.id === career.stageId)?.order ?? 1;
  const night = career.daypart === 'night';
  const venueId = career.venueId;
  const layout = venueLayout(venueId);
  const selected = slots.find((s) => s.spec.id === selectedId) ?? null;
  const hintSpec = (highlightProp ? layout.all.find((p) => p.id === highlightProp) : null) ?? null;
  const focusTone: Tone = selected?.tone ?? (mode === 'situation' ? 'warn' : 'accent');
  const npcs = npcSpawns(career);
  const upgrades = {
    monitor: hasVisual(career, 'monitor'),
    chair: hasVisual(career, 'chair'),
    glow: hasVisual(career, 'glow'),
    banner: hasVisual(career, 'banner'),
    desk: hasVisual(career, 'desk'),
  };

  const hotThreads = career.activeThreads.filter((t) => t.intensity >= 40).slice(0, 2);
  const showBanner = upgrades.banner || order >= 4;
  const ownedSetup = career.ownedItems.length;

  const focusSpec = selected?.spec ?? hintSpec;
  const playerSpot = walkTarget ?? (focusSpec ? standingSpot(focusSpec) : { fx: 1.2, fy: -2.6 });
  const player = floorToScreen(venueId, playerSpot.fx, playerSpot.fy);
  const focusFloor = focusSpec ? floorToScreen(venueId, focusSpec.fx, focusSpec.fy) : null;

  const propState = (spec: PropSpec) => {
    if (mode === 'situation') {
      return highlightProp === spec.id ? ('selected' as const) : ('muted' as const);
    }
    const slot = slots.find((s) => s.spec.id === spec.id);
    if (!slot) return highlightProp === spec.id ? ('lit' as const) : ('idle' as const);
    if (!slot.available) return 'locked' as const;
    if (selected && selected.spec.id !== spec.id) return 'muted' as const;
    if (selected) return 'selected' as const;
    return 'lit' as const;
  };

  return (
    <IsoRoom venueId={venueId} night={night} weather={career.worldClock.weather}>
      {layout.all.map((spec) => {
        if (spec.id === 'banner' && !showBanner) return null;
        if (spec.minStageOrder && spec.minStageOrder > order && spec.id !== 'banner') return null;

        const slot = slots.find((s) => s.spec.id === spec.id);
        const interactive = mode === 'week' && slot?.available;
        const isSituationFocus = mode === 'situation' && highlightProp === spec.id;
        const state = propState(spec);
        const tone = slot?.tone ?? focusTone;

        return (
          <View key={spec.id} style={[styles.prop, boxOf(spec)]} pointerEvents="box-none">
            <RoomProp venueId={venueId} spec={spec} state={state} tone={tone} />
            {spec.id === 'rig' ? (
              <RigUpgrades
                monitor={upgrades.monitor}
                chair={upgrades.chair}
                glow={upgrades.glow}
                desk={upgrades.desk}
              />
            ) : null}

            {interactive || isSituationFocus ? (
              <Pressable
                onPress={
                  isSituationFocus ? onHighlightPress : slot ? () => onSelect(slot) : undefined
                }
                style={styles.fill}
                accessibilityRole="button"
                accessibilityLabel={slot?.activity.label ?? 'Foco'}
              />
            ) : null}

            {slot && !slot.available && slot.lockLabel ? (
              <View style={styles.lockTag} pointerEvents="none">
                <Text style={styles.lockText}>{slot.lockLabel}</Text>
              </View>
            ) : null}

            {slot?.available && !selected && mode === 'week' ? (
              <View
                style={[styles.pip, { backgroundColor: tones[slot.tone].fg }]}
                pointerEvents="none"
              />
            ) : null}

            {(selected?.spec.id === spec.id || isSituationFocus) && slot ? (
              <View style={styles.callout} pointerEvents="none">
                <View style={[styles.calloutLine, { backgroundColor: tones[tone].fg }]} />
                <View style={[styles.calloutTab, { backgroundColor: tones[tone].fg }]}>
                  <Text style={styles.calloutText}>{slot.activity.label.toUpperCase()}</Text>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}

      {focusFloor ? (
        <FloorSpot x={focusFloor.x} y={focusFloor.y} tone={focusTone} on size={11} />
      ) : null}

      {npcs.map((npc) => {
        const at = floorToScreen(venueId, npc.fx, npc.fy);
        const threadHit = hotThreads.some((t) => t.actors.includes(npc.kind));
        const threadKind = hotThreads.find((t) => t.actors.includes(npc.kind))?.kind;
        return (
          <WorldActor
            key={npc.kind}
            x={at.x}
            y={at.y}
            kind={npc.kind}
            label={npc.name ?? npc.kind}
            tone={npc.urgency && npc.urgency >= 50 ? 'danger' : threadHit ? 'warn' : 'blue'}
            urgency={Math.max(npc.urgency ?? 0, threadHit ? 55 : 0)}
            bubble={
              threadHit && threadKind
                ? threadKind.replace(/_/g, ' ')
                : npc.urgency && npc.urgency >= 55
                  ? '!'
                  : null
            }
            onPress={onNpc ? () => onNpc(npc) : undefined}
          />
        );
      })}

      <WorldActor
        x={player.x}
        y={player.y}
        kind="player"
        label={career.profile.name.slice(0, 1)}
        tone="accent"
        isPlayer
      />

      <View style={styles.venueTag} pointerEvents="none">
        <Text style={styles.venueTagText}>{layout.name.toUpperCase()}</Text>
        <Text style={styles.ambience} numberOfLines={1}>
          {career.worldClock.ambience}
          {ownedSetup > 0 ? ` · setup ${ownedSetup}/5` : ''}
          {hotThreads.length ? ` · ${hotThreads.length} hilo${hotThreads.length > 1 ? 's' : ''}` : ''}
        </Text>
      </View>
    </IsoRoom>
  );
}

const FILL = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const;

const styles = StyleSheet.create({
  fill: FILL,
  prop: { position: 'absolute' },

  floorSpot: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    zIndex: 1,
  },

  pip: {
    position: 'absolute',
    right: '6%',
    top: '4%',
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  lockTag: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: '38%',
    backgroundColor: 'rgba(8,9,12,0.92)',
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 5,
    paddingVertical: 2,
    transform: [{ skewX: SKEW }],
  },
  lockText: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 7.5,
    letterSpacing: 0.8,
    transform: [{ skewX: UNSKEW }],
  },

  callout: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -24,
    alignItems: 'center',
  },
  calloutLine: { width: 1, height: 8, opacity: 0.7 },
  calloutTab: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    transform: [{ skewX: SKEW }],
  },
  calloutText: {
    color: colors.onAccent,
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    letterSpacing: 1.1,
    transform: [{ skewX: UNSKEW }],
  },

  venueTag: {
    position: 'absolute',
    left: 8,
    top: 8,
    maxWidth: '70%',
    gap: 2,
    zIndex: 40,
  },
  venueTagText: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  ambience: {
    color: colors.faint,
    fontFamily: fonts.body,
    fontSize: 9,
  },
});
