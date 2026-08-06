import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { availableVenues, getVenue } from '../engine/venues';
import type { VenueId } from '../engine/types';
import { roomBg } from '../room/roomArt';
import { useGameStore } from '../store/gameStore';
import { Button, LiveDot, Panel } from '../ui/components';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import { colors, fonts, maxContentWidth, space, tones } from '../ui/theme';

/** Franja horizontal de sedes (CityStrip) con miniatura de diorama iso. */
export function CityScreen() {
  const pack = useGameStore((s) => s.pack);
  const career = useGameStore((s) => s.career);
  const travel = useGameStore((s) => s.travel);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!career) return null;

  const order = pack.stages.find((s) => s.id === career.stageId)?.order ?? 1;
  const venues = availableVenues(order);
  const here = getVenue(career.venueId);
  const weather = career.worldClock.weather;

  return (
    <View style={styles.root}>
      <MobaBackdrop intensity="play" stageId={career.stageId} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>MAPA · {weather.toUpperCase()}</Text>
          <Text style={styles.title}>City strip</Text>
          <Text style={styles.blurb}>
            Estás en {here.label}. Viajar suma un poco de fatiga — elegí con cabeza.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.strip}
          >
            {venues.map((v) => {
              const on = v.id === career.venueId;
              const art = roomBg(v.id as VenueId);
              return (
                <Pressable
                  key={v.id}
                  onPress={() => {
                    if (!on) travel(v.id);
                    setScreen('weekHub');
                  }}
                  style={[styles.node, on && styles.nodeOn]}
                >
                  <View style={styles.artBox}>
                    <Image source={art} style={styles.art} contentFit="cover" />
                    {!on ? <View style={styles.artVeil} /> : null}
                  </View>
                  {on ? <LiveDot /> : <View style={styles.dot} />}
                  <Text style={[styles.nodeLabel, on && styles.nodeLabelOn]}>{v.label}</Text>
                  <Text style={styles.nodeBlurb} numberOfLines={3}>
                    {v.blurb}
                  </Text>
                  {!on ? <Text style={styles.fatigue}>+2 fatiga</Text> : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <Panel tone="muted" label="Tip">
            <Text style={styles.tip}>
              Match day se juega en la Arena. Scrims en Academia. Descanso en pieza o gym.
            </Text>
          </Panel>

          <Button label="Volver" variant="ghost" onPress={() => setScreen('weekHub')} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

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
  strip: { gap: 10, paddingVertical: 4 },
  node: {
    width: 156,
    minHeight: 210,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgCard,
    gap: 6,
  },
  nodeOn: { borderColor: tones.accent.border, backgroundColor: 'rgba(80,220,160,0.08)' },
  artBox: {
    height: 96,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    position: 'relative',
    backgroundColor: colors.bgSunken,
  },
  art: { width: '100%', height: '100%' },
  artVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(5,7,12,0.45)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.faint,
  },
  nodeLabel: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  nodeLabelOn: { color: tones.accent.fg },
  nodeBlurb: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, lineHeight: 15 },
  fatigue: { color: tones.warn.fg, fontFamily: fonts.bodyBold, fontSize: 10 },
  tip: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
});
