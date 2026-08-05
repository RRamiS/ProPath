import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { buildMatchBeats, pickOpponent } from './simulate';
import { Body, Button, Title } from '../ui/components';
import { FadeSlide } from '../ui/motion';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import { colors, fonts, radius, space } from '../ui/theme';

export function LiveMatchScreen() {
  const career = useGameStore((s) => s.career);
  const resolveLiveMatch = useGameStore((s) => s.resolveLiveMatch);

  const opponent = useMemo(() => {
    if (!career) return 'Rival';
    return pickOpponent(career.rngSeed, career.stageId).name;
  }, [career]);

  const beats = useMemo(
    () => buildMatchBeats(career?.profile.roleId ?? 'mid'),
    [career?.profile.roleId]
  );

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [feed, setFeed] = useState<string[]>(['Draft phase · luces ON']);
  const momentum = useSharedValue(50);

  const beat = beats[phaseIndex];
  const done = phaseIndex >= beats.length;

  const barStyle = useAnimatedStyle(() => ({
    width: `${momentum.value}%`,
  }));

  if (!career) return null;

  const onPick = (choiceId: string, label: string, mom: number) => {
    const nextChoices = [...choices, choiceId];
    setChoices(nextChoices);
    setFeed((f) => [...f, label].slice(-6));
    momentum.value = withTiming(Math.max(8, Math.min(92, momentum.value + mom * 12)), {
      duration: 320,
    });

    if (phaseIndex + 1 >= beats.length) {
      resolveLiveMatch(nextChoices, opponent);
      return;
    }
    setPhaseIndex((p) => p + 1);
  };

  return (
    <View style={styles.root}>
      <MobaBackdrop intensity="cinematic" stageId="arena" />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.broadcast}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.live}>LIVE MATCH</Text>
            </View>
            <Text style={styles.vs}>
              {career.profile.name}  vs  {opponent}
            </Text>
            <View style={styles.scoreboard}>
              <Text style={styles.scoreSide}>US</Text>
              <View style={styles.momTrack}>
                <Animated.View style={[styles.momFill, barStyle]} />
              </View>
              <Text style={styles.scoreSide}>THEM</Text>
            </View>
            <Text style={styles.formLine}>
              Forma {career.form} · Fatiga {career.fatigue} · Duo {career.relations.duo}
            </Text>
          </View>

          <View style={styles.feed}>
            {feed.map((line, i) => (
              <Text key={`${line}-${i}`} style={styles.feedLine}>
                › {line}
              </Text>
            ))}
          </View>

          {!done && beat ? (
            <FadeSlide key={beat.phase}>
              <Text style={styles.phase}>{beat.phase.toUpperCase()}</Text>
              <Title style={{ fontSize: 24 }}>{beat.title}</Title>
              <Body style={{ marginVertical: 12 }}>{beat.body}</Body>
              {beat.choices.map((c, i) => (
                <FadeSlide key={c.id} delay={i * 40}>
                  <Button
                    variant="choice"
                    label={c.label}
                    hint={c.hint}
                    onPress={() => onPick(c.id, c.label, c.momentum)}
                  />
                </FadeSlide>
              ))}
            </FadeSlide>
          ) : (
            <Body>Resolviendo resultado…</Body>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xxl,
  },
  broadcast: {
    backgroundColor: 'rgba(8,12,18,0.92)',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(61,220,151,0.35)',
    marginBottom: 14,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: colors.danger,
    marginRight: 8,
  },
  live: {
    color: colors.danger,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  vs: {
    color: colors.text,
    fontFamily: fonts.displaySemi,
    fontSize: 20,
    marginBottom: 12,
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreSide: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    width: 36,
  },
  momTrack: {
    flex: 1,
    height: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255,107,122,0.35)',
    overflow: 'hidden',
  },
  momFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 99,
  },
  formLine: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    marginTop: 10,
  },
  feed: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 72,
  },
  feedLine: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 18,
  },
  phase: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.6,
    marginBottom: 6,
  },
});
