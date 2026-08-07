/**
 * Mapa de la ciudad: recorrido entre sedes, no un strip de tarjetas.
 * Tocás un nodo para viajar (+2 fatiga).
 */
import { useEffect } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { availableVenues, getVenue, VENUES } from '../engine/venues';
import { canTravel, travelFare } from '../engine/economy';
import type { RelationKey, VenueId } from '../engine/types';
import { roomBg } from '../room/roomArt';
import { useGameStore } from '../store/gameStore';
import { Button, LiveDot, Panel } from '../ui/components';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import { colors, fonts, maxContentWidth, space, tones } from '../ui/theme';

/** Posiciones normalizadas (0–1) en el lienzo del mapa. */
const MAP_POS: Record<VenueId, { x: number; y: number }> = {
  home: { x: 0.22, y: 0.78 },
  gym: { x: 0.68, y: 0.64 },
  cafe: { x: 0.28, y: 0.48 },
  academy: { x: 0.66, y: 0.3 },
  arena: { x: 0.36, y: 0.12 },
};

/** Aristas del camino (orden de recorrido típico). */
const PATH: Array<[VenueId, VenueId]> = [
  ['home', 'gym'],
  ['gym', 'cafe'],
  ['cafe', 'academy'],
  ['academy', 'arena'],
  ['home', 'cafe'],
];

/** Empty state con CTA suave según sede. */
function emptyNpcHint(venueId: VenueId): string {
  switch (venueId) {
    case 'gym':
      return 'Nadie del círculo acá. El rival suele aparecer entre series — o andá al café.';
    case 'cafe':
      return 'Mesa vacía por ahora. Duo, rival o manager rotan por acá a lo largo del día.';
    case 'academy':
      return 'Booths quietas. Coach y duo suelen estar en scrim/VOD — volvé en otro bloque.';
    case 'arena':
      return 'Túnel vacío. En match day el coach y el rival aparecen.';
    case 'home':
    default:
      return 'Pieza sola. El dúo a veces pasa; si no, probá el café o el gym.';
  }
}

function PathLine({
  a,
  b,
  active,
}: {
  a: { x: number; y: number };
  b: { x: number; y: number };
  active: boolean;
}) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.pathLine,
        {
          left: `${midX * 100}%`,
          top: `${midY * 100}%`,
          width: `${len * 100}%`,
          marginLeft: `${(-len * 100) / 2}%`,
          transform: [{ rotate: `${angle}deg` }],
          backgroundColor: active ? 'rgba(80,220,160,0.45)' : 'rgba(120,140,180,0.22)',
        },
      ]}
    />
  );
}

function YouAreHere() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);
  const anim = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.45,
    transform: [{ scale: 0.85 + pulse.value * 0.25 }],
  }));
  return <Animated.View style={[styles.hereRing, anim]} />;
}

export function CityScreen() {
  const pack = useGameStore((s) => s.pack);
  const career = useGameStore((s) => s.career);
  const travel = useGameStore((s) => s.travel);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!career) return null;

  const order = pack.stages.find((s) => s.id === career.stageId)?.order ?? 1;
  const open = new Set(availableVenues(order).map((v) => v.id));
  const here = getVenue(career.venueId);
  const weather = career.worldClock.weather;
  const herePos = MAP_POS[career.venueId];

  const npcsAt = (venueId: VenueId) => {
    const kinds = Object.keys(career.npcStates) as RelationKey[];
    return kinds
      .filter((k) => career.npcStates[k].venueId === venueId)
      .map((k) => career.roster[k].name.split(' ')[0] ?? k);
  };

  const weatherWash =
    weather === 'rain'
      ? (['rgba(40,70,120,0.35)', 'rgba(10,16,28,0.15)'] as const)
      : weather === 'heat'
        ? (['rgba(120,70,30,0.28)', 'rgba(20,10,4,0.12)'] as const)
        : weather === 'fog'
          ? (['rgba(90,100,120,0.32)', 'rgba(14,16,22,0.18)'] as const)
          : (['rgba(20,28,48,0.2)', 'rgba(6,8,14,0.08)'] as const);

  return (
    <View style={styles.root}>
      <MobaBackdrop intensity="play" stageId={career.stageId} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>MAPA · {weather.toUpperCase()}</Text>
          <Text style={styles.title}>La ciudad</Text>
          <Text style={styles.blurb}>
            Estás en {here.label} · ${career.cash}. Viajar cuesta plata (+2 fatiga). Casa es
            gratis.
          </Text>

          <View style={styles.map}>
            <LinearGradient
              colors={['#0a101c', '#12182a', '#0c1420']}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient colors={[...weatherWash]} style={StyleSheet.absoluteFill} />

            {/* Cuadrícula suave */}
            {[0.2, 0.4, 0.6, 0.8].map((y) => (
              <View key={`h${y}`} style={[styles.gridH, { top: `${y * 100}%` }]} />
            ))}
            {[0.25, 0.5, 0.75].map((x) => (
              <View key={`v${x}`} style={[styles.gridV, { left: `${x * 100}%` }]} />
            ))}

            {PATH.map(([from, to]) => {
              const a = MAP_POS[from];
              const b = MAP_POS[to];
              const active =
                (career.venueId === from || career.venueId === to) &&
                open.has(from) &&
                open.has(to);
              return <PathLine key={`${from}-${to}`} a={a} b={b} active={active} />;
            })}

            {VENUES.map((v) => {
              const pos = MAP_POS[v.id];
              const unlocked = open.has(v.id);
              const on = v.id === career.venueId;
              const art = roomBg(v.id);
              const who = unlocked ? npcsAt(v.id) : [];
              const fare = travelFare(v.id);
              const trip = canTravel(career, v.id);
              const broke = !on && unlocked && !trip.ok;

              return (
                <Pressable
                  key={v.id}
                  disabled={!unlocked}
                  onPress={() => {
                    if (on || !unlocked) {
                      setScreen('weekHub');
                      return;
                    }
                    travel(v.id);
                  }}
                  style={[
                    styles.node,
                    {
                      left: `${pos.x * 100}%`,
                      top: `${pos.y * 100}%`,
                    },
                    on && styles.nodeOn,
                    !unlocked && styles.nodeLocked,
                    broke && styles.nodeBroke,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    unlocked
                      ? broke
                        ? `${v.label}: sin fondos ($${fare})`
                        : `Viajar a ${v.label}${fare ? ` $${fare}` : ''}`
                      : `${v.label} bloqueado`
                  }
                >
                  {on ? <YouAreHere /> : null}
                  <View style={[styles.artBox, on && styles.artBoxOn]}>
                    <Image source={art} style={styles.art} contentFit="cover" />
                    {!unlocked || !on ? <View style={styles.artVeil} /> : null}
                  </View>
                  <View style={styles.nodeMeta}>
                    {on ? <LiveDot size={6} /> : <View style={styles.dot} />}
                    <Text
                      style={[
                        styles.nodeLabel,
                        on && styles.nodeLabelOn,
                        !unlocked && styles.nodeLabelLocked,
                      ]}
                      numberOfLines={1}
                    >
                      {v.label}
                    </Text>
                  </View>
                  {!on && unlocked ? (
                    <Text style={[styles.fare, broke && styles.fareBroke]} numberOfLines={1}>
                      {broke ? `$${fare} · seco` : fare > 0 ? `$${fare}` : 'gratis'}
                    </Text>
                  ) : null}
                  {who.length > 0 ? (
                    <Text style={styles.who} numberOfLines={1}>
                      {who.join(' · ')}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}

            <View
              pointerEvents="none"
              style={[
                styles.youPin,
                {
                  left: `${herePos.x * 100}%`,
                  top: `${herePos.y * 100}%`,
                },
              ]}
            />
          </View>

          <Panel tone="accent" label={here.label} style={styles.detail}>
            <Text style={styles.detailBlurb}>{here.blurb}</Text>
            <Text style={styles.detailActs}>
              Actividades: {here.activities.join(' · ')}
            </Text>
            {npcsAt(career.venueId).length > 0 ? (
              <Text style={styles.detailActs}>
                Acá ahora: {npcsAt(career.venueId).join(', ')}
              </Text>
            ) : (
              <Text style={styles.detailActs}>
                {emptyNpcHint(career.venueId)}
              </Text>
            )}
          </Panel>

          {career.lastNotice &&
          (career.lastNotice.includes('viajar') ||
            career.lastNotice.includes('SIN FONDOS') ||
            career.lastNotice.includes('Necesitás $')) ? (
            <Panel tone="danger" label="Sin fondos" style={styles.detail}>
              <Text style={styles.detailBlurb}>{career.lastNotice}</Text>
            </Panel>
          ) : null}

          <Panel tone="muted" label="Ruta">
            <Text style={styles.tip}>
              Pieza → Gym → Café → Academia → Arena. Match day en Arena; scrims en Academia;
              descanso en pieza o gym.
            </Text>
          </Panel>

          <Button label="Volver" variant="ghost" onPress={() => setScreen('weekHub')} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const NODE_W = 108;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scroll: {
    padding: space.lg,
    paddingBottom: space.xxl,
    maxWidth: maxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: 12,
  },
  kicker: {
    color: tones.blue.fg,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: -1,
  },
  blurb: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },

  map: {
    width: '100%',
    height: 420,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.bgSunken,
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(120,140,180,0.08)',
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(120,140,180,0.08)',
  },
  pathLine: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
  },

  node: {
    position: 'absolute',
    width: NODE_W,
    marginLeft: -NODE_W / 2,
    marginTop: -52,
    alignItems: 'center',
    gap: 3,
    zIndex: 5,
  },
  nodeOn: { zIndex: 8 },
  nodeLocked: { opacity: 0.45 },
  nodeBroke: { opacity: 0.75 },
  fare: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    textAlign: 'center',
  },
  fareBroke: { color: colors.danger },
  artBox: {
    width: 88,
    height: 64,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgSunken,
  },
  artBoxOn: { borderColor: tones.accent.border },
  art: { width: '100%', height: '100%' },
  artVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(5,7,12,0.4)',
  },
  nodeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.faint,
  },
  nodeLabel: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    maxWidth: 96,
  },
  nodeLabelOn: { color: tones.accent.fg },
  nodeLabelLocked: { color: colors.faint },
  who: {
    color: tones.blue.fg,
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    maxWidth: 100,
    textAlign: 'center',
  },
  fatigue: { color: tones.warn.fg, fontFamily: fonts.bodyBold, fontSize: 9 },
  lock: { color: colors.faint, fontFamily: fonts.bodyBold, fontSize: 9 },
  hereLabel: {
    color: tones.accent.fg,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  hereRing: {
    position: 'absolute',
    top: -6,
    width: 100,
    height: 76,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: tones.accent.fg,
    backgroundColor: 'rgba(80,220,160,0.08)',
    zIndex: -1,
  },
  youPin: {
    position: 'absolute',
    width: 10,
    height: 10,
    marginLeft: -5,
    marginTop: 18,
    borderRadius: 5,
    backgroundColor: tones.accent.fg,
    zIndex: 9,
  },

  detail: { gap: 4 },
  detailBlurb: { color: colors.text, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  detailActs: { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 11 },
  tip: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
});
