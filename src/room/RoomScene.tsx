/**
 * El diorama de la semana. La habitación es el menú: cada objeto es una acción.
 *
 * Dos ideas prestadas y adaptadas:
 * - Persona 5: la jerarquía se hace con LUZ. Lo elegible se ilumina, el resto
 *   se apaga. Y una línea guía lleva el ojo del objeto a la etiqueta.
 * - YouTubers Life: el cuarto sube de categoría con vos, así el progreso se ve
 *   sin leer un número. Pero acá todo objeto dice qué hace y qué cuesta,
 *   que es justo lo que a ese juego le criticaron.
 */
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { CareerState, ContentPack } from '../engine/types';
import { venueAllows } from '../engine/venues';
import { isMatchWeek, WEEK_ACTIVITIES, type WeekActivity } from '../engine/week';
import { colors, fonts, SKEW, stageGradient, tones, UNSKEW, type Tone } from '../ui/theme';
import { ACTION_PROPS, DECOR_PROPS, HORIZON, type PropId, type PropSpec } from './layout';
import { PropArt } from './props';
import { hasVisual } from '../engine/economy';
import { npcSpawns, type NpcSpawn } from '../engine/venues';

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
  return ACTION_PROPS.map((spec) => {
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
  }).filter((x): x is RoomSlot => x !== null);
}

function box(spec: PropSpec) {
  return {
    left: `${spec.left}%` as const,
    top: `${spec.top}%` as const,
    width: `${spec.width}%` as const,
    height: `${spec.height}%` as const,
  };
}

/** Piso en falsa perspectiva: líneas que se separan al acercarse. */
function FloorGrid({ tone, night }: { tone: Tone; night: boolean }) {
  const t = tones[tone];
  const lines = Array.from({ length: 7 }, (_, i) => (i + 1) / 8);
  return (
    <View style={styles.floor} pointerEvents="none">
      <LinearGradient
        colors={night ? ['#0A0D14', '#05070B'] : ['#101520', '#07090E']}
        style={StyleSheet.absoluteFill}
      />
      {lines.map((t0, i) => (
        <View
          key={i}
          style={[
            styles.floorLine,
            {
              top: `${Math.pow(t0, 1.9) * 100}%`,
              opacity: 0.05 + t0 * 0.12,
              backgroundColor: t.fg,
            },
          ]}
        />
      ))}
      {[-30, -14, 14, 30].map((deg, i) => (
        <View
          key={`v${i}`}
          style={[
            styles.floorRay,
            { transform: [{ rotate: `${deg}deg` }], opacity: 0.06, backgroundColor: t.fg },
          ]}
        />
      ))}
    </View>
  );
}

/** Foco que persigue al objeto elegido: es la jerarquía de la escena. */
function KeyLight({
  x,
  y,
  tone,
  on,
}: {
  x: number;
  y: number;
  tone: Tone;
  on: boolean;
}) {
  const px = useSharedValue(x);
  const py = useSharedValue(y);
  const op = useSharedValue(0);

  useEffect(() => {
    px.value = withTiming(x, { duration: 320 });
    py.value = withTiming(y, { duration: 320 });
    op.value = withTiming(on ? 1 : 0, { duration: 260 });
  }, [x, y, on, px, py, op]);

  const style = useAnimatedStyle(() => ({
    left: `${px.value}%`,
    top: `${py.value}%`,
    opacity: op.value,
  }));

  const t = tones[tone];
  return (
    <Animated.View style={[styles.keyLight, style]} pointerEvents="none">
      <View style={[styles.glowRing, styles.glow3, { backgroundColor: t.fg }]} />
      <View style={[styles.glowRing, styles.glow2, { backgroundColor: t.fg }]} />
      <View style={[styles.glowRing, styles.glow1, { backgroundColor: t.fg }]} />
    </Animated.View>
  );
}

export function RoomScene({
  career,
  pack,
  slots,
  selectedId,
  onSelect,
  onNpc,
}: {
  career: CareerState;
  pack: ContentPack;
  slots: RoomSlot[];
  selectedId: string | null;
  onSelect: (slot: RoomSlot) => void;
  onNpc?: (npc: NpcSpawn) => void;
}) {
  const order = pack.stages.find((s) => s.id === career.stageId)?.order ?? 1;
  const night = career.daypart === 'night';
  const grad = stageGradient[career.stageId] ?? stageGradient.soloq!;
  const selected = slots.find((s) => s.spec.id === selectedId) ?? null;
  const lightTone = selected?.tone ?? 'accent';
  const npcs = npcSpawns(career);
  const upgrades = {
    monitor: hasVisual(career, 'monitor'),
    chair: hasVisual(career, 'chair'),
    glow: hasVisual(career, 'glow'),
    banner: hasVisual(career, 'banner'),
    desk: hasVisual(career, 'desk'),
  };

  const targetX = selected
    ? selected.spec.left + selected.spec.width * 0.35
    : 48;
  const targetY = selected
    ? selected.spec.top + selected.spec.height * 0.75
    : 68;

  const ax = useSharedValue(48);
  const ay = useSharedValue(68);

  useEffect(() => {
    ax.value = withTiming(targetX, { duration: 420 });
    ay.value = withTiming(targetY, { duration: 420 });
  }, [targetX, targetY, ax, ay]);

  const avatarStyle = useAnimatedStyle(() => ({
    left: `${ax.value}%`,
    top: `${ay.value}%`,
  }));

  const lx = selected ? selected.spec.left + selected.spec.width / 2 : 50;
  const ly = selected ? selected.spec.top + selected.spec.height / 2 : 45;

  const showBanner =
    upgrades.banner || DECOR_PROPS.some((d) => d.id === 'banner' && (d.minStageOrder ?? 0) <= order);

  return (
    <View style={styles.scene}>
      <LinearGradient colors={grad} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={
          night
            ? ['rgba(8,12,30,0.72)', 'rgba(4,6,12,0.2)']
            : ['rgba(30,36,50,0.35)', 'rgba(4,6,12,0.15)']
        }
        style={StyleSheet.absoluteFill}
      />

      <FloorGrid tone={lightTone} night={night} />
      <View style={styles.baseboard} />

      <KeyLight x={lx} y={ly} tone={lightTone} on={selected !== null} />

      {DECOR_PROPS.filter((d) => {
        if (d.id === 'banner') return showBanner;
        return (d.minStageOrder ?? 0) <= order;
      }).map((d) => (
        <View key={d.id} style={[styles.prop, box(d), styles.decor]} pointerEvents="none">
          <PropArt
            id={d.id}
            lit={false}
            tone={lightTone}
            stageOrder={order}
            night={night}
            upgrades={upgrades}
          />
        </View>
      ))}

      {slots.map((slot) => {
        const isSel = slot.spec.id === selectedId;
        const dim = selected !== null && !isSel;
        return (
          <Hotspot
            key={slot.spec.id}
            slot={slot}
            selected={isSel}
            dim={dim}
            stageOrder={order}
            night={night}
            upgrades={upgrades}
            onPress={() => onSelect(slot)}
          />
        );
      })}

      {npcs.map((npc) => (
        <Pressable
          key={npc.kind}
          onPress={() => onNpc?.(npc)}
          style={[
            styles.npc,
            { left: `${npc.left}%`, top: `${npc.top}%` },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Hablar con ${npc.kind}`}
        >
          <View style={[styles.npcBody, { borderColor: tones.blue.border }]}>
            <Text style={styles.npcInitial}>{npc.kind.slice(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={styles.npcLabel}>{npc.kind}</Text>
        </Pressable>
      ))}

      <Animated.View style={[styles.avatar, avatarStyle]} pointerEvents="none">
        <View style={styles.avatarHead} />
        <View style={styles.avatarTorso} />
        <View style={styles.avatarShadow} />
      </Animated.View>

      <LinearGradient
        colors={['rgba(4,6,11,0)', 'rgba(4,6,11,0.35)', 'rgba(4,6,11,0.85)']}
        locations={[0.35, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.vignetteL} pointerEvents="none" />
      <View style={styles.vignetteR} pointerEvents="none" />
    </View>
  );
}

function Hotspot({
  slot,
  selected,
  dim,
  stageOrder,
  night,
  upgrades,
  onPress,
}: {
  slot: RoomSlot;
  selected: boolean;
  dim: boolean;
  stageOrder: number;
  night: boolean;
  upgrades: {
    monitor: boolean;
    chair: boolean;
    glow: boolean;
    banner: boolean;
    desk: boolean;
  };
  onPress: () => void;
}) {
  const t = tones[slot.tone];
  const lift = useSharedValue(0);

  useEffect(() => {
    lift.value = withTiming(selected ? 1 : 0, { duration: 240 });
  }, [selected, lift]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 * lift.value }, { scale: 1 + 0.035 * lift.value }],
  }));

  const opacity = !slot.available ? 0.3 : dim ? 0.52 : 1;

  return (
    <Animated.View style={[styles.prop, box(slot.spec), anim, { opacity }]}>
      <Pressable
        onPress={slot.available ? onPress : undefined}
        disabled={!slot.available}
        accessibilityRole="button"
        accessibilityLabel={
          slot.available ? slot.activity.label : `${slot.activity.label} — ${slot.lockLabel}`
        }
        style={StyleSheet.absoluteFill}
      >
        <PropArt
          id={slot.spec.id as PropId}
          lit={selected || (!dim && slot.available)}
          tone={slot.tone}
          stageOrder={stageOrder}
          night={night}
          upgrades={upgrades}
        />
        {selected ? (
          <>
            <View style={[styles.selCorner, styles.selTL, { borderColor: t.fg }]} />
            <View style={[styles.selCorner, styles.selBR, { borderColor: t.fg }]} />
          </>
        ) : null}
      </Pressable>

      {!slot.available && slot.lockLabel ? (
        <View style={styles.lockTag} pointerEvents="none">
          <Text style={styles.lockText}>{slot.lockLabel}</Text>
        </View>
      ) : null}

      {slot.available && !selected ? (
        <View style={[styles.pip, { backgroundColor: t.fg }]} pointerEvents="none" />
      ) : null}

      {selected ? (
        <View style={styles.callout} pointerEvents="none">
          <View style={[styles.calloutLine, { backgroundColor: t.fg }]} />
          <View style={[styles.calloutTab, { backgroundColor: t.fg }]}>
            <Text style={styles.calloutText}>{slot.activity.label.toUpperCase()}</Text>
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scene: {
    width: '100%',
    aspectRatio: 1.42,
    overflow: 'hidden',
    backgroundColor: colors.bgSunken,
    borderWidth: 1,
    borderColor: colors.line,
  },
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: `${HORIZON * 100}%`,
    bottom: 0,
    overflow: 'hidden',
  },
  floorLine: { position: 'absolute', left: 0, right: 0, height: 1 },
  floorRay: {
    position: 'absolute',
    left: '50%',
    top: '-40%',
    bottom: '-40%',
    width: 1,
  },
  baseboard: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: `${HORIZON * 100}%`,
    height: 2,
    backgroundColor: 'rgba(244,247,251,0.1)',
  },

  keyLight: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: { position: 'absolute', borderRadius: 999 },
  glow1: { width: 90, height: 90, marginLeft: -45, marginTop: -45, opacity: 0.1 },
  glow2: { width: 150, height: 150, marginLeft: -75, marginTop: -75, opacity: 0.06 },
  glow3: { width: 230, height: 230, marginLeft: -115, marginTop: -115, opacity: 0.035 },

  prop: { position: 'absolute' },
  decor: { opacity: 0.72 },

  selCorner: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  selTL: { left: -4, top: -4, borderLeftWidth: 2, borderTopWidth: 2 },
  selBR: { right: -4, bottom: -4, borderRightWidth: 2, borderBottomWidth: 2 },

  pip: {
    position: 'absolute',
    right: -3,
    top: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  lockTag: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: '42%',
    backgroundColor: 'rgba(8,9,12,0.9)',
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
    top: -26,
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

  vignetteL: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '18%',
    backgroundColor: 'rgba(4,6,11,0.45)',
  },
  vignetteR: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '14%',
    backgroundColor: 'rgba(4,6,11,0.4)',
  },

  avatar: {
    position: 'absolute',
    width: 28,
    height: 44,
    marginLeft: -14,
    marginTop: -40,
    alignItems: 'center',
    zIndex: 8,
  },
  avatarHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.onAccent,
  },
  avatarTorso: {
    width: 16,
    height: 20,
    marginTop: 2,
    backgroundColor: '#1A2030',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  avatarShadow: {
    position: 'absolute',
    bottom: -2,
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  npc: {
    position: 'absolute',
    width: 36,
    alignItems: 'center',
    marginLeft: -18,
    zIndex: 7,
  },
  npcBody: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 1.5,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  npcInitial: {
    color: colors.blue,
    fontFamily: fonts.display,
    fontSize: 13,
  },
  npcLabel: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
