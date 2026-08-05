import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Body, Button, Label, StatBar, Title } from '../ui/components';
import { FadeSlide } from '../ui/motion';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import { CareerHud } from '../ui/CareerHud';
import { ShareCard } from '../ui/ShareCard';
import { colors, fonts, radius, shadow, springs, space } from '../ui/theme';
import { useGameStore } from '../store/gameStore';
import { RUN_DURATIONS, type RunDurationId } from '../engine';

function Atmosphere({
  landing = false,
  stageId,
}: {
  landing?: boolean;
  stageId?: string;
}) {
  return <MobaBackdrop intensity={landing ? 'landing' : 'play'} showArt={landing} stageId={stageId} />;
}

export function HomeScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const pack = useGameStore((s) => s.pack);

  return (
    <View style={styles.root}>
      <Atmosphere landing />
      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <FadeSlide delay={0}>
            <Text style={styles.brand}>{pack.title}</Text>
          </FadeSlide>
          <FadeSlide delay={60}>
            <Text style={styles.tagline}>{pack.subtitle}</Text>
          </FadeSlide>
          <FadeSlide delay={120}>
            <Body style={styles.heroCopy}>
              Hub semanal, partidos live estilo broadcast y relaciones que importan — sin nombres
              de marcas. Tu carrera, tus manos.
            </Body>
          </FadeSlide>
          <FadeSlide delay={180} style={styles.ctaBlock}>
            <Button label="Empezar carrera" onPress={() => setScreen('create')} />
            <Text style={styles.micro}>Semanas · Match day · Finales</Text>
          </FadeSlide>
        </View>
      </SafeAreaView>
    </View>
  );
}

export function CreateScreen() {
  const pack = useGameStore((s) => s.pack);
  const draft = useGameStore((s) => s.draft);
  const setDraft = useGameStore((s) => s.setDraft);
  const startCareer = useGameStore((s) => s.startCareer);
  const setScreen = useGameStore((s) => s.setScreen);
  const nation = pack.nations.find((n) => n.id === draft.nationId);

  return (
    <View style={styles.root}>
      <Atmosphere />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FadeSlide>
            <Title>Tu jugador</Title>
            <Body style={styles.intro}>
              Duración, nacionalidad y rol definen el arco de la carrera.
            </Body>
          </FadeSlide>

          <Label>Duración</Label>
          <Body style={styles.inlineHint}>Ni muy corta ni infinita — vos elegís el ritmo.</Body>
          {RUN_DURATIONS.map((d, i) => (
            <FadeSlide key={d.id} delay={i * 40}>
              <Button
                variant="choice"
                selected={draft.durationId === d.id}
                label={`${d.label}  ·  ${d.maxTurns} semanas`}
                hint={`${d.minutesHint} — ${d.blurb}`}
                onPress={() => setDraft({ durationId: d.id as RunDurationId })}
              />
            </FadeSlide>
          ))}

          <Label>Nombre</Label>
          <TextInput
            value={draft.name}
            onChangeText={(name) => setDraft({ name })}
            placeholder="Ej: FrostAR"
            placeholderTextColor={colors.faint}
            style={styles.input}
            autoCorrect={false}
          />

          <Label>Nacionalidad</Label>
          <Body style={styles.inlineHint}>Cambia región, visas, plata y eventos.</Body>
          {pack.nations.map((n, i) => (
            <FadeSlide key={n.id} delay={i * 30}>
              <Button
                variant="choice"
                selected={draft.nationId === n.id}
                label={`${n.flag}  ${n.name}`}
                onPress={() => setDraft({ nationId: n.id })}
              />
            </FadeSlide>
          ))}
          {nation ? (
            <View style={styles.nationCard}>
              <Text style={styles.nationBlurb}>{nation.blurb}</Text>
            </View>
          ) : null}

          <Label>Rol</Label>
          {pack.roles.map((r, i) => (
            <FadeSlide key={r.id} delay={i * 30}>
              <Button
                variant="choice"
                selected={draft.roleId === r.id}
                label={r.name}
                hint={r.description}
                onPress={() => setDraft({ roleId: r.id })}
              />
            </FadeSlide>
          ))}

          <View style={styles.row}>
            <View style={styles.rowBtn}>
              <Button label="Volver" variant="ghost" onPress={() => setScreen('home')} />
            </View>
            <View style={styles.rowBtnPrimary}>
              <Button label="Jugar" onPress={startCareer} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export function PlayScreen() {
  const pack = useGameStore((s) => s.pack);
  const career = useGameStore((s) => s.career);
  const choose = useGameStore((s) => s.choose);
  const enterMinigame = useGameStore((s) => s.enterMinigame);

  if (!career || !career.currentEventId) {
    return (
      <View style={styles.root}>
        <Atmosphere stageId={career?.stageId} />
        <SafeAreaView style={styles.safe}>
          <Body style={{ padding: 24 }}>Cargando evento…</Body>
        </SafeAreaView>
      </View>
    );
  }

  const event = pack.events.find((e) => e.id === career.currentEventId);

  if (!event) {
    return (
      <View style={styles.root}>
        <Atmosphere stageId={career.stageId} />
        <Body style={{ padding: 24 }}>Evento no encontrado.</Body>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Atmosphere stageId={career.stageId} />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <FadeSlide key={`${career.currentEventId}-${career.turn}`}>
            <CareerHud career={career} pack={pack} compact />

            {career.lastMatch ? (
              <View style={styles.matchChip}>
                <Text style={styles.matchChipText}>
                  Último: {career.lastMatch.won ? 'W' : 'L'} vs {career.lastMatch.opponent} ·{' '}
                  {career.lastMatch.kills}/{career.lastMatch.deaths}/{career.lastMatch.assists}
                  {career.lastMatch.mvp ? ' · MVP' : ''}
                </Text>
              </View>
            ) : null}

            <View style={[styles.statsCard, shadow]}>
              {Object.entries(pack.statLabels).map(([id, label], i) => (
                <StatBar
                  key={`${id}-${career.turn}`}
                  label={label}
                  value={career.stats[id] ?? 0}
                  delay={i * 30}
                />
              ))}
            </View>

            <View style={styles.eventBlock}>
              <Text style={styles.eventEyebrow}>
                {event.minigame ? 'Skill check disponible' : 'Momento de la semana'}
              </Text>
              <Title style={{ fontSize: 24 }}>{event.title}</Title>
              <Body style={{ marginTop: 10, marginBottom: 18 }}>{event.body}</Body>

              {event.minigame ? (
                <View style={styles.skillCard}>
                  <Text style={styles.skillTitle}>{event.minigame.title}</Text>
                  <Text style={styles.skillBlurb}>{event.minigame.blurb}</Text>
                  <Button label="Jugar minijuego" onPress={enterMinigame} />
                  <Text style={styles.orSkip}>o elegí una decisión de texto abajo</Text>
                </View>
              ) : null}

              {event.choices.map((c, i) => (
                <FadeSlide key={c.id} delay={i * 45}>
                  <Button
                    variant="choice"
                    label={c.label}
                    hint={c.hint}
                    onPress={() => choose(c.id)}
                  />
                </FadeSlide>
              ))}
            </View>
          </FadeSlide>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export function EndingScreen() {
  const pack = useGameStore((s) => s.pack);
  const career = useGameStore((s) => s.career);
  const reset = useGameStore((s) => s.reset);
  const ending = pack.endings.find((e) => e.id === career?.endingId);
  const reveal = useSharedValue(0);

  useEffect(() => {
    reveal.value = withDelay(80, withSpring(1, springs.soft));
  }, [reveal]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [
      { translateY: interpolate(reveal.value, [0, 1], [24, 0]) },
      { scale: interpolate(reveal.value, [0, 1], [0.96, 1]) },
    ],
  }));

  return (
    <View style={styles.root}>
      <Atmosphere stageId={career?.stageId} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.endingScroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.hero, cardStyle]}>
            <Text style={styles.endingTier}>
              {ending?.tier === 'legend'
                ? 'LEYENDA'
                : ending?.tier === 'great'
                  ? 'RISING'
                  : ending?.tier === 'ok'
                    ? 'REGIONAL'
                    : 'FIN'}
            </Text>
            <Text style={[styles.brand, styles.endingTitle]}>{ending?.title ?? 'Fin'}</Text>
            <Body style={styles.heroCopy}>{ending?.body}</Body>
            {career ? <ShareCard career={career} pack={pack} ending={ending} /> : null}
            <Text style={styles.micro}>Screenshot la tarjeta para compartir</Text>
            <View style={styles.endingCta}>
              <Button label="Nueva carrera" onPress={reset} />
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scrollFlex: { flex: 1 },
  hero: {
    flex: 1,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xxl,
  },
  brand: {
    color: colors.accent,
    fontSize: 48,
    lineHeight: 54,
    fontFamily: fonts.display,
    letterSpacing: -1.4,
    marginBottom: 10,
  },
  endingTitle: {
    fontSize: 40,
    lineHeight: 46,
  },
  tagline: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.displaySemi,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  heroCopy: {
    maxWidth: 420,
    marginBottom: 8,
  },
  intro: {
    marginTop: 8,
    marginBottom: 4,
  },
  ctaBlock: {
    marginTop: space.md,
  },
  micro: {
    color: colors.faint,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    textAlign: 'center',
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bodyMedium,
    marginBottom: 4,
    width: '100%',
  },
  inlineHint: { marginBottom: 10, marginTop: -4 },
  nationCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(61,220,151,0.25)',
  },
  nationBlurb: {
    color: colors.accent,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyMedium,
  },
  row: {
    flexDirection: 'row',
    marginTop: space.lg,
  },
  rowBtn: { flex: 1, marginRight: 6 },
  rowBtnPrimary: { flex: 1.2, marginLeft: 6 },
  topMeta: { marginBottom: 14 },
  metaPrimary: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    marginBottom: 4,
  },
  metaSecondary: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    letterSpacing: 0.3,
  },
  statsCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 18,
  },
  eventBlock: { marginTop: 4 },
  eventEyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  endingTier: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  endingStats: { marginTop: 8 },
  endingCta: { marginTop: space.md },
  endingScroll: {
    flexGrow: 1,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    justifyContent: 'center',
  },
  matchChip: {
    backgroundColor: 'rgba(232,197,107,0.1)',
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,197,107,0.28)',
  },
  matchChipText: {
    color: colors.gold,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
  notice: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(61,220,151,0.28)',
  },
  noticeText: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodySemi,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  cornerTL: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 28,
    height: 28,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(61,220,151,0.45)',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(61,220,151,0.45)',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,107,122,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: colors.danger,
    marginRight: 6,
  },
  liveText: {
    color: colors.danger,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  skillCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,197,107,0.35)',
    marginBottom: 16,
  },
  skillTitle: {
    color: colors.gold,
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    marginBottom: 6,
  },
  skillBlurb: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  orSkip: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
