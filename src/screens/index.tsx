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
import {
  Body,
  Button,
  Chip,
  IconBadge,
  Panel,
  PopIn,
  PressCard,
  SectionHeader,
  Shutter,
  StatBar,
  Tag,
  Title,
} from '../ui/components';
import { EffectChips } from '../ui/effects';
import { Icon, type IconName } from '../ui/icons';
import { FadeSlide } from '../ui/motion';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import { CareerHud } from '../ui/CareerHud';
import { NationBadge } from '../ui/NationBadge';
import { ShareCard } from '../ui/ShareCard';
import {
  colors,
  fonts,
  maxContentWidth,
  radius,
  SKEW,
  space,
  springs,
  tones,
  UNSKEW,
  type Tone,
} from '../ui/theme';
import { useGameStore } from '../store/gameStore';
import { RUN_DURATIONS, type RunDurationId } from '../engine';

function Atmosphere({ landing = false, stageId }: { landing?: boolean; stageId?: string }) {
  return (
    <MobaBackdrop
      intensity={landing ? 'landing' : 'play'}
      showArt={landing}
      stageId={stageId}
    />
  );
}

const TIER_TONE: Record<string, Tone> = {
  legend: 'gold',
  great: 'accent',
  ok: 'blue',
  fail: 'danger',
};

const TIER_LABEL: Record<string, string> = {
  legend: 'LEYENDA',
  great: 'RISING STAR',
  ok: 'REGIONAL',
  fail: 'FIN DE CICLO',
};

/* ------------------------------------------------------------------ home */

function FeatureRow({
  index,
  icon,
  tone,
  title,
  copy,
}: {
  index: string;
  icon: IconName;
  tone: Tone;
  title: string;
  copy: string;
}) {
  return (
    <View style={styles.feature}>
      <Text style={[styles.featureIndex, { color: tones[tone].fg }]} numberOfLines={1}>
        {index}
      </Text>
      <View style={[styles.featureRule, { backgroundColor: tones[tone].border }]} />
      <View style={styles.featureText}>
        <View style={styles.featureTitleRow}>
          <Icon name={icon} color={tones[tone].fg} size={15} />
          <Text style={styles.featureTitle}>{title}</Text>
        </View>
        <Text style={styles.featureCopy}>{copy}</Text>
      </View>
    </View>
  );
}

export function HomeScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const pack = useGameStore((s) => s.pack);

  return (
    <View style={styles.root}>
      <Atmosphere landing />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.homeScroll}
          showsVerticalScrollIndicator={false}
        >
          <FadeSlide delay={0}>
            <Tag label="Simulador de carrera esports" tone="accent" solid />
          </FadeSlide>

          <FadeSlide delay={60}>
            <View style={styles.brandWrap}>
              <Text style={styles.brand}>{pack.title}</Text>
              <View style={styles.brandSlab} />
            </View>
          </FadeSlide>

          <FadeSlide delay={110}>
            <Text style={styles.tagline}>{pack.subtitle}</Text>
          </FadeSlide>

          <FadeSlide delay={150}>
            <View style={styles.statStrip}>
              <View style={styles.statStripItem}>
                <Text style={styles.statStripNum}>5</Text>
                <Text style={styles.statStripLabel}>ETAPAS</Text>
              </View>
              <View style={styles.statStripDivider} />
              <View style={styles.statStripItem}>
                <Text style={styles.statStripNum}>10</Text>
                <Text style={styles.statStripLabel}>MINIJUEGOS</Text>
              </View>
              <View style={styles.statStripDivider} />
              <View style={styles.statStripItem}>
                <Text style={styles.statStripNum}>{pack.events.length}</Text>
                <Text style={styles.statStripLabel}>EVENTOS</Text>
              </View>
            </View>
          </FadeSlide>

          <FadeSlide delay={200} style={styles.featureList}>
            <FeatureRow
              index="01"
              icon="soloq"
              tone="accent"
              title="Una semana, una decisión"
              copy="SoloQ, scrims, VOD, descanso o contenido. Todo tiene precio en forma y fatiga."
            />
            <FeatureRow
              index="02"
              icon="match"
              tone="danger"
              title="Partidos en vivo"
              copy="Cuatro fases jugables y un desglose que te dice exactamente por qué ganaste."
            />
            <FeatureRow
              index="03"
              icon="scrim"
              tone="blue"
              title="Gente que se acuerda"
              copy="Coach, duo, rival y manager cambian los eventos según cómo los tratás."
            />
          </FadeSlide>

          <FadeSlide delay={280} style={styles.ctaBlock}>
            <Button label="Empezar carrera" onPress={() => setScreen('create')} />
            <Text style={styles.micro}>
              {RUN_DURATIONS.map((d) => d.label).join(' · ')} — vos elegís el largo
            </Text>
          </FadeSlide>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ---------------------------------------------------------------- create */

export function CreateScreen() {
  const pack = useGameStore((s) => s.pack);
  const draft = useGameStore((s) => s.draft);
  const setDraft = useGameStore((s) => s.setDraft);
  const startCareer = useGameStore((s) => s.startCareer);
  const setScreen = useGameStore((s) => s.setScreen);
  const nation = pack.nations.find((n) => n.id === draft.nationId);
  const role = pack.roles.find((r) => r.id === draft.roleId);

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
            <Tag label="Nuevo prospecto" tone="accent" solid />
            <Title style={styles.createTitle}>Tu jugador</Title>
            <Body style={styles.intro}>
              Duración, nacionalidad y rol definen el arco completo de la carrera.
            </Body>
          </FadeSlide>

          <SectionHeader eyebrow="Paso 01" title="Duración" />
          <View style={styles.gridTwo}>
            {RUN_DURATIONS.map((d, i) => {
              const on = draft.durationId === d.id;
              return (
                <FadeSlide key={d.id} delay={i * 40} style={styles.gridItem}>
                  <PressCard
                    tone={on ? 'accent' : undefined}
                    selected={on}
                    onPress={() => setDraft({ durationId: d.id as RunDurationId })}
                    style={styles.durationCard}
                  >
                    <Text style={[styles.durationWeeks, on && { color: colors.accent }]}>
                      {d.maxTurns}
                    </Text>
                    <Text style={[styles.durationLabel, on && { color: colors.text }]}>
                      {d.label}
                    </Text>
                    <Text style={styles.durationHint}>{d.minutesHint}</Text>
                  </PressCard>
                </FadeSlide>
              );
            })}
          </View>

          <SectionHeader eyebrow="Paso 02" title="Nombre" tone="blue" />
          <TextInput
            value={draft.name}
            onChangeText={(name) => setDraft({ name })}
            placeholder="Ej: FrostAR"
            placeholderTextColor={colors.faint}
            style={styles.input}
            autoCorrect={false}
            maxLength={16}
          />

          <SectionHeader
            eyebrow="Paso 03"
            title="Nacionalidad"
            tone="violet"
            right={<Tag label="Región y visas" tone="muted" />}
          />
          <View style={styles.gridTwo}>
            {pack.nations.map((n, i) => {
              const on = draft.nationId === n.id;
              return (
                <FadeSlide key={n.id} delay={i * 25} style={styles.gridItem}>
                  <PressCard
                    tone={on ? 'violet' : undefined}
                    selected={on}
                    onPress={() => setDraft({ nationId: n.id })}
                    style={styles.nationCard}
                  >
                    <NationBadge nationId={n.id} tone={on ? 'violet' : 'muted'} solid={on} />
                    <Text
                      style={[styles.nationName, on && { color: colors.violet }]}
                      numberOfLines={1}
                    >
                      {n.name}
                    </Text>
                  </PressCard>
                </FadeSlide>
              );
            })}
          </View>
          {nation ? (
            <Shutter>
              <Panel tone="violet" glow label={nation.name} style={styles.selectionNote}>
                <Text style={styles.selectionNoteText}>{nation.blurb}</Text>
              </Panel>
            </Shutter>
          ) : null}

          <SectionHeader eyebrow="Paso 04" title="Rol" tone="gold" />
          {pack.roles.map((r, i) => (
            <FadeSlide key={r.id} delay={i * 25}>
              <Button
                variant="choice"
                tone="gold"
                selected={draft.roleId === r.id}
                label={r.name}
                hint={r.description}
                onPress={() => setDraft({ roleId: r.id })}
              />
            </FadeSlide>
          ))}

          <Panel label="Resumen" tone="accent" style={styles.summary}>
            <View style={styles.summaryChips}>
              <Chip label={draft.name?.trim() || 'Prodigy'} tone="accent" />
              <Chip label={nation?.name ?? '—'} tone="violet" />
              <Chip label={role?.name ?? '—'} tone="gold" />
              <Chip
                label={
                  RUN_DURATIONS.find((d) => d.id === draft.durationId)?.label ?? 'Estándar'
                }
                tone="blue"
              />
            </View>
          </Panel>

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

/* ------------------------------------------------------------------ play */

export function PlayScreen() {
  const pack = useGameStore((s) => s.pack);
  const career = useGameStore((s) => s.career);
  const choose = useGameStore((s) => s.choose);
  const enterMinigame = useGameStore((s) => s.enterMinigame);
  const reset = useGameStore((s) => s.reset);

  if (!career || !career.currentEventId) {
    return (
      <View style={styles.root}>
        <Atmosphere stageId={career?.stageId} />
        <SafeAreaView style={styles.safe}>
          <Body style={styles.pad}>Cargando evento…</Body>
        </SafeAreaView>
      </View>
    );
  }

  const event = pack.events.find((e) => e.id === career.currentEventId);

  if (!event) {
    return (
      <View style={styles.root}>
        <Atmosphere stageId={career.stageId} />
        <SafeAreaView style={styles.safe}>
          <Body style={styles.pad}>Evento no encontrado.</Body>
        </SafeAreaView>
      </View>
    );
  }

  const last = career.lastMatch;

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
            <CareerHud career={career} pack={pack} compact onExit={reset} />

            {last ? (
              <View style={styles.lastMatchRow}>
                <Chip
                  label={`${last.won ? 'VICTORIA' : 'DERROTA'} vs ${last.opponent}`}
                  tone={last.won ? 'accent' : 'danger'}
                />
                <Chip label={`${last.kills}/${last.deaths}/${last.assists}`} tone="muted" />
                {last.mvp ? <Chip label="MVP" tone="gold" /> : null}
              </View>
            ) : null}

            <Panel label="Atributos" style={styles.statsCard}>
              {Object.entries(pack.statLabels).map(([id, label], i) => (
                <StatBar
                  key={`${id}-${career.turn}`}
                  label={label}
                  value={career.stats[id] ?? 0}
                  delay={i * 30}
                />
              ))}
            </Panel>

            <SectionHeader
              eyebrow={event.minigame ? 'Skill check disponible' : 'Momento de la semana'}
              title={event.title}
              tone={event.minigame ? 'gold' : 'accent'}
            />
            <Body style={styles.eventBody}>{event.body}</Body>

            {event.minigame ? (
              <Panel tone="gold" glow label="Skill check" style={styles.skillCard}>
                <View style={styles.skillHead}>
                  <Icon name="spark" color={colors.gold} size={18} />
                  <Text style={styles.skillTitle}>{event.minigame.title}</Text>
                </View>
                <Text style={styles.skillBlurb}>{event.minigame.blurb}</Text>
                <Button label="Jugar minijuego" tone="gold" onPress={enterMinigame} />
                <Text style={styles.orSkip}>o resolvelo con una decisión de abajo</Text>
              </Panel>
            ) : null}

            {event.choices.map((c, i) => (
              <FadeSlide key={c.id} delay={i * 45}>
                <PressCard onPress={() => choose(c.id)} style={styles.choiceCard}>
                  <Text style={styles.choiceLabel}>{c.label}</Text>
                  {c.hint ? <Text style={styles.choiceHint}>{c.hint}</Text> : null}
                  <View style={styles.choiceChips}>
                    <EffectChips effect={c.effect} statLabels={pack.statLabels} />
                  </View>
                </PressCard>
              </FadeSlide>
            ))}
          </FadeSlide>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ---------------------------------------------------------------- ending */

export function EndingScreen() {
  const pack = useGameStore((s) => s.pack);
  const career = useGameStore((s) => s.career);
  const reset = useGameStore((s) => s.reset);
  const ending = pack.endings.find((e) => e.id === career?.endingId);
  const reveal = useSharedValue(0);
  const tone = TIER_TONE[ending?.tier ?? 'ok'] ?? 'accent';

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
        <ScrollView
          contentContainerStyle={styles.endingScroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={cardStyle}>
            <PopIn>
              <View style={styles.endingHead}>
                <IconBadge name="trophy" tone={tone} size={44} />
                <View style={[styles.endingTierTab, { backgroundColor: tones[tone].fg }]}>
                  <Text style={styles.endingTierText}>{TIER_LABEL[ending?.tier ?? 'ok']}</Text>
                </View>
              </View>
            </PopIn>

            <Text style={styles.endingTitle}>{ending?.title ?? 'Retiro'}</Text>
            <Body style={styles.endingBody}>{ending?.body}</Body>

            {career ? (
              <Text style={styles.legacyMeta}>
                {career.ageYears} años · {career.season} temp. · ${career.cash} ·{' '}
                {career.wins}V–{career.losses}D
              </Text>
            ) : null}

            {career ? <ShareCard career={career} pack={pack} ending={ending} /> : null}
            <Text style={styles.micro}>Sacale screenshot a la tarjeta para compartirla</Text>

            <View style={styles.endingCta}>
              <Button label="Nueva carrera" onPress={reset} />
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ---------------------------------------------------------------- styles */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scrollFlex: { flex: 1 },
  pad: { padding: space.lg },
  scroll: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xxl,
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
  },

  /* home */
  homeScroll: {
    flexGrow: 1,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    justifyContent: 'center',
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
  },
  brandWrap: {
    marginTop: 16,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  brand: {
    color: colors.text,
    fontSize: 58,
    lineHeight: 62,
    fontFamily: fonts.display,
    letterSpacing: -3,
    textTransform: 'uppercase',
  },
  brandSlab: {
    height: 8,
    backgroundColor: colors.accent,
    marginTop: -4,
    transform: [{ skewX: SKEW }],
  },
  tagline: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 25,
    fontFamily: fonts.displaySemi,
    letterSpacing: -0.3,
    maxWidth: 420,
  },
  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
  },
  statStripItem: { flex: 1 },
  statStripNum: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -1,
  },
  statStripLabel: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    marginTop: 2,
  },
  statStripDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.line,
    marginHorizontal: 12,
  },
  featureList: { marginTop: space.lg, gap: 16 },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIndex: {
    fontFamily: fonts.display,
    fontSize: 15,
    letterSpacing: 0,
    minWidth: 26,
    paddingTop: 2,
  },
  featureRule: {
    width: 2,
    alignSelf: 'stretch',
    marginRight: 2,
  },
  featureText: { flex: 1 },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  featureTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  featureCopy: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 3,
  },
  ctaBlock: { marginTop: space.xl },
  micro: {
    color: colors.faint,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    textAlign: 'center',
    marginTop: 12,
  },

  /* create */
  createTitle: { marginTop: 12 },
  intro: { marginTop: 8, marginBottom: 8 },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 104,
  },
  durationCard: { height: '100%', gap: 1 },
  durationWeeks: {
    color: colors.muted,
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: -1.2,
  },
  durationLabel: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  durationHint: {
    color: colors.faint,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  nationCard: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  nationName: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    flex: 1,
  },
  selectionNote: { marginTop: 12, paddingVertical: 12 },
  selectionNoteText: {
    color: colors.violet,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.bodyMedium,
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
    width: '100%',
  },
  summary: { marginTop: space.xl },
  summaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    marginTop: space.lg,
    gap: 12,
  },
  rowBtn: { flex: 1 },
  rowBtnPrimary: { flex: 1.3 },

  /* play */
  lastMatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  statsCard: { marginBottom: 20, paddingBottom: 8 },
  eventBody: { marginBottom: 18 },
  skillCard: { marginBottom: 18 },
  skillHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  skillTitle: {
    color: colors.gold,
    fontFamily: fonts.display,
    fontSize: 17,
    letterSpacing: -0.4,
  },
  skillBlurb: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  orSkip: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  choiceCard: { marginBottom: 10, gap: 6 },
  choiceLabel: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  choiceHint: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  choiceChips: { marginTop: 2 },

  /* ending */
  endingScroll: {
    flexGrow: 1,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    justifyContent: 'center',
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
  },
  endingHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  endingTierTab: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    transform: [{ skewX: SKEW }],
  },
  endingTierText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    transform: [{ skewX: UNSKEW }],
  },
  endingTitle: {
    color: colors.text,
    fontSize: 38,
    lineHeight: 44,
    fontFamily: fonts.display,
    letterSpacing: -1.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  endingBody: { maxWidth: 440 },
  legacyMeta: {
    color: colors.gold,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    marginBottom: 12,
  },
  endingCta: { marginTop: space.md },
});
