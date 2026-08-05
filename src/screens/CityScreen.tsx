import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { availableVenues, getVenue } from '../engine/venues';
import { useGameStore } from '../store/gameStore';
import { Button, LiveDot, Panel, Tag } from '../ui/components';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import { colors, fonts, maxContentWidth, SKEW, space, tones, UNSKEW } from '../ui/theme';

/** Franja de sedes tipo Kingdom: pocas, legibles, con costo de fatiga al viajar. */
export function CityScreen() {
  const pack = useGameStore((s) => s.pack);
  const career = useGameStore((s) => s.career);
  const travel = useGameStore((s) => s.travel);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!career) return null;

  const order = pack.stages.find((s) => s.id === career.stageId)?.order ?? 1;
  const venues = availableVenues(order);
  const here = getVenue(career.venueId);

  return (
    <View style={styles.root}>
      <MobaBackdrop intensity="play" stageId={career.stageId} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>MAPA</Text>
          <Text style={styles.title}>City strip</Text>
          <Text style={styles.blurb}>
            Estás en {here.label}. Viajar suma un poco de fatiga — elegí con cabeza.
          </Text>

          <View style={styles.strip}>
            {venues.map((v) => {
              const on = v.id === career.venueId;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => {
                    if (!on) travel(v.id);
                    setScreen('weekHub');
                  }}
                  style={[styles.node, on && styles.nodeOn]}
                >
                  {on ? <LiveDot /> : <View style={styles.dot} />}
                  <Text style={[styles.nodeLabel, on && styles.nodeLabelOn]}>{v.label}</Text>
                  <Text style={styles.nodeBlurb} numberOfLines={2}>
                    {v.blurb}
                  </Text>
                  {!on ? <Text style={styles.fatigue}>+2 fatiga</Text> : null}
                </Pressable>
              );
            })}
          </View>

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
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  blurb: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  strip: { gap: 8 },
  node: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 4,
  },
  nodeOn: {
    borderColor: tones.accent.border,
    backgroundColor: colors.accentSoft,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.faint,
    marginBottom: 4,
  },
  nodeLabel: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  nodeLabelOn: { color: colors.accent },
  nodeBlurb: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  fatigue: {
    color: colors.warn,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  tip: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
});
