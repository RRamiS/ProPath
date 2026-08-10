import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  Tag,
  Title,
} from '../ui/components';
import { Icon, type IconName } from '../ui/icons';
import { FadeSlide } from '../ui/motion';
import { HowToSheet } from '../ui/HowToSheet';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import { CareerHud } from '../ui/CareerHud';
import { NationBadge } from '../ui/NationBadge';
import { ShareCard } from '../ui/ShareCard';
import { shareViewAsImage } from '../ui/shareLegacy';
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
import { SituationScene } from './SituationScene';
import { currentPlayableEvent } from '../engine/applyChoice';
import { isMuted, setMuted, subscribeMute } from '../ui/audio';
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
  const saveSummary = useGameStore((s) => s.saveSummary);
  const continueCareer = useGameStore((s) => s.continueCareer);
  const deleteSave = useGameStore((s) => s.deleteSave);
  const career = useGameStore((s) => s.career);
  const replayHowTo = useGameStore((s) => s.replayHowTo);
  const [muted, setMutedUi] = useState(isMuted);
  const [howtoOpen, setHowtoOpen] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const stageName = saveSummary
    ? (pack.stages.find((s) => s.id === saveSummary.stageId)?.name ?? saveSummary.stageId)
    : null;
  const hasSave = !!saveSummary;

  useEffect(() => subscribeMute(setMutedUi), []);

  return (
    <View style={styles.root}>
      <Atmosphere landing />
      <HowToSheet visible={howtoOpen} onClose={() => setHowtoOpen(false)} />
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
              copy="Ranked solo, entrenar en equipo, repasá partidas, descansá o hacé contenido. Todo pesa en forma y fatiga."
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
            <FeatureRow
              index="04"
              icon="match"
              tone="violet"
              title="Mapa de sedes"
              copy="Pieza, gym, café, academia, arena. Cada lugar abre acciones y gente distinta."
            />
          </FadeSlide>

          <FadeSlide delay={280} style={styles.ctaBlock}>
            {saveSummary && !saveSummary.ending ? (
              <>
                <Button label="Continuar carrera" onPress={() => void continueCareer()} />
                <Text style={styles.saveMeta}>
                  {saveSummary.name} · {stageName} · Semana {saveSummary.weekInSeason + 1}/
                  {saveSummary.maxTurns} · {saveSummary.wins}–{saveSummary.losses} · $
                  {saveSummary.cash}
                </Text>
                <Button
                  label="Nueva carrera"
                  variant="ghost"
                  onPress={() => setScreen('create')}
                />
              </>
            ) : saveSummary?.ending ? (
              <>
                <Button label="Ver último final" onPress={() => void continueCareer()} />
                <Button
                  label="Nueva carrera"
                  variant="ghost"
                  onPress={() => setScreen('create')}
                />
              </>
            ) : (
              <Button label="Empezar carrera" onPress={() => setScreen('create')} />
            )}
            <Text style={styles.micro}>
              El rol que elijas define tu carrera — y cambiarlo tiene precio. El progreso se
              guarda solo.
            </Text>

            <View style={styles.playtestBox}>
              <Text style={styles.playtestLabel}>PLAYTEST</Text>
              <View style={styles.playtestRow}>
                <Pressable
                  onPress={() => void setMuted(!muted)}
                  style={styles.playtestBtn}
                  hitSlop={6}
                >
                  <Text style={styles.playtestBtnText}>
                    {muted ? 'Sonido: off' : 'Sonido: on'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setHowtoOpen(true)}
                  style={styles.playtestBtn}
                  hitSlop={6}
                >
                  <Text style={styles.playtestBtnText}>Cómo se juega</Text>
                </Pressable>
              </View>
              {career && !career.endingId ? (
                <Pressable
                  onPress={() => replayHowTo()}
                  style={styles.playtestBtnWide}
                  hitSlop={6}
                >
                  <Text style={styles.playtestBtnText}>Repetir coach en la sede</Text>
                </Pressable>
              ) : null}
              {hasSave ? (
                confirmWipe ? (
                  <View style={styles.wipeConfirm}>
                    <Text style={styles.wipeWarn}>
                      ¿Borrar la partida de {saveSummary?.name}? No se puede deshacer.
                    </Text>
                    <View style={styles.playtestRow}>
                      <Pressable
                        onPress={() => setConfirmWipe(false)}
                        style={styles.playtestBtn}
                      >
                        <Text style={styles.playtestBtnText}>Cancelar</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setConfirmWipe(false);
                          void deleteSave();
                        }}
                        style={[styles.playtestBtn, styles.wipeBtn]}
                      >
                        <Text style={[styles.playtestBtnText, styles.wipeBtnText]}>
                          Sí, borrar
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setConfirmWipe(true)}
                    style={styles.playtestBtnWide}
                    hitSlop={6}
                  >
                    <Text style={[styles.playtestBtnText, styles.wipeLink]}>
                      Borrar partida guardada
                    </Text>
                  </Pressable>
                )
              ) : null}
            </View>
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
  const saveSummary = useGameStore((s) => s.saveSummary);
  const nation = pack.nations.find((n) => n.id === draft.nationId);
  const role = pack.roles.find((r) => r.id === draft.roleId);
  const overwrites = !!saveSummary && !saveSummary.ending;
  const canStart = !!draft.nationId && !!draft.roleId;

  return (
    <View style={styles.root}>
      <Atmosphere />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.createScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FadeSlide>
            <Tag label="Nuevo prospecto" tone="accent" solid />
            <Title style={styles.createTitle}>Tu jugador</Title>
            <Body style={styles.intro}>
              Nacionalidad y rol son apuestas. El rol define cómo crecés, cómo jugás
              las series y cómo te lee el circuito.
            </Body>
          </FadeSlide>

          <SectionHeader eyebrow="Paso 01" title="Nombre" tone="blue" />
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
            eyebrow="Paso 02"
            title="Nacionalidad"
            tone="violet"
            right={<Tag label="Región y visas" tone="muted" />}
          />
          <View style={styles.gridTwo}>
            {pack.nations.map((n) => {
              const on = draft.nationId === n.id;
              return (
                <View key={n.id} style={styles.gridItem}>
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
                </View>
              );
            })}
          </View>
          {nation ? (
            <Panel tone="violet" glow label={nation.name} style={styles.selectionNote}>
              <Text style={styles.selectionNoteText} numberOfLines={4}>
                {nation.blurb}
              </Text>
            </Panel>
          ) : null}

          <SectionHeader
            eyebrow="Paso 03"
            title="Rol"
            tone="gold"
            right={<Tag label="Decisión clave" tone="gold" />}
          />
          <Body style={styles.roleIntro}>
            No es un skin: es tu posición en el mapa. Podés cambiar entre splits, pero
            cuesta plata, forma y confianza del staff.
          </Body>
          {pack.roles.map((r) => {
            const on = draft.roleId === r.id;
            return (
              <PressCard
                key={r.id}
                tone={on ? 'gold' : undefined}
                selected={on}
                onPress={() => setDraft({ roleId: r.id })}
                style={styles.roleCard}
              >
                <View style={styles.roleHead}>
                  <Text style={[styles.roleName, on && { color: colors.gold }]}>{r.name}</Text>
                  <Text style={styles.rolePrimary} numberOfLines={1}>
                    {r.primaryStats.map((s) => pack.statLabels[s] ?? s).join(' · ')}
                  </Text>
                </View>
                <Text style={styles.roleDesc} numberOfLines={3}>
                  {r.description}
                </Text>
                <Text style={styles.roleStakes} numberOfLines={2}>
                  {r.stakes}
                </Text>
              </PressCard>
            );
          })}

          <Panel label="Resumen" tone="accent" style={styles.summary}>
            <View style={styles.summaryChips}>
              <Chip label={draft.name?.trim() || 'Prodigy'} tone="accent" />
              <Chip label={nation?.name ?? '—'} tone="violet" />
              <Chip label={role?.name ?? '—'} tone="gold" />
            </View>
            {role ? (
              <Text style={styles.summaryStakes} numberOfLines={3}>
                {role.stakes}
              </Text>
            ) : null}
          </Panel>

          {overwrites ? (
            <Text style={styles.overwriteWarn}>
              Empezar borra la partida de {saveSummary?.name} (semana{' '}
              {(saveSummary?.weekInSeason ?? 0) + 1}).
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.createFooter}>
          <View style={styles.row}>
            <View style={styles.rowBtn}>
              <Button label="Volver" variant="ghost" onPress={() => setScreen('home')} />
            </View>
            <View style={styles.rowBtnPrimary}>
              <Button
                label={overwrites ? 'Reemplazar y jugar' : 'Jugar'}
                onPress={startCareer}
                disabled={!canStart}
              />
            </View>
          </View>
        </View>
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
  const softFail = useGameStore((s) => s.softFail);
  const goHome = useGameStore((s) => s.goHome);

  if (!career || !career.currentEventId) {
    return (
      <View style={styles.root}>
        <Atmosphere stageId={career?.stageId} />
        <SafeAreaView style={styles.safe}>
          <Body style={styles.pad}>No hay evento activo.</Body>
          <View style={styles.pad}>
            <Button
              label="Volver al hub"
              onPress={() => {
                const c = useGameStore.getState().career;
                if (c) {
                  useGameStore.setState({
                    career: {
                      ...c,
                      phase: 'hub',
                      currentEventId: null,
                      currentSituation: null,
                    },
                    screen: 'weekHub',
                  });
                } else {
                  useGameStore.getState().setScreen('weekHub');
                }
              }}
            />
            <Button label="Menú" variant="ghost" onPress={() => void goHome()} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const event = currentPlayableEvent(pack, career);

  if (!event) {
    return (
      <View style={styles.root}>
        <Atmosphere stageId={career.stageId} />
        <SafeAreaView style={styles.safe}>
          <Body style={styles.pad}>Evento no encontrado.</Body>
          <View style={styles.pad}>
            <Button
              label="Volver al hub"
              onPress={() => {
                useGameStore.setState({
                  career: {
                    ...career,
                    phase: 'hub',
                    currentEventId: null,
                    currentSituation: null,
                  },
                  screen: 'weekHub',
                });
              }}
            />
            <Button label="Menú" variant="ghost" onPress={() => void goHome()} />
          </View>
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
          <FadeSlide key={`${career.currentEventId}-${career.turn}-${career.currentSituation?.instanceId}`}>
            <CareerHud career={career} pack={pack} compact onExit={() => void goHome()} />

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

            <SituationScene
              career={career}
              pack={pack}
              onChoose={choose}
              onMinigame={enterMinigame}
              onSoftFail={softFail}
            />
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
  const goHome = useGameStore((s) => s.goHome);
  const ending = pack.endings.find((e) => e.id === career?.endingId);
  const reveal = useSharedValue(0);
  const tone = TIER_TONE[ending?.tier ?? 'ok'] ?? 'accent';
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [shareHint, setShareHint] = useState('Compartí tu tarjeta de legacy');

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

  const onShareLegacy = async () => {
    if (!career || sharing) return;
    setSharing(true);
    const message = `ProPath · ${ending?.title ?? 'Legacy'} · ${career.profile.name} ${career.wins}-${career.losses}`;
    const result = await shareViewAsImage(cardRef, {
      dialogTitle: 'ProPath Legacy',
      message,
    });
    setSharing(false);
    if (result === 'unavailable') {
      setShareHint('Sharing no disponible acá — sacá screenshot a la tarjeta');
    } else if (result === 'failed') {
      setShareHint('No se pudo compartir. Probá de nuevo.');
    } else {
      setShareHint('Listo — mandala a donde quieras');
    }
  };

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

            {career ? (
              <View ref={cardRef} collapsable={false}>
                <ShareCard career={career} pack={pack} ending={ending} />
              </View>
            ) : null}
            <Text style={styles.micro}>{shareHint}</Text>

            <View style={styles.endingCta}>
              <Button
                label={sharing ? 'Preparando…' : 'Compartir legacy'}
                onPress={() => void onShareLegacy()}
                disabled={sharing || !career}
                tone="gold"
              />
              <Button label="Nueva carrera" onPress={reset} variant="ghost" />
              <Button label="Menú" variant="ghost" onPress={() => void goHome()} />
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
  saveMeta: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
    lineHeight: 17,
  },
  micro: {
    color: colors.faint,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    textAlign: 'center',
    marginTop: 12,
  },
  playtestBox: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 10,
  },
  playtestLabel: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  playtestRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  playtestBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  playtestBtnWide: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  playtestBtnText: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  wipeConfirm: { gap: 10 },
  wipeWarn: {
    color: colors.danger,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  wipeBtn: { borderColor: colors.danger },
  wipeBtnText: { color: colors.danger },
  wipeLink: { color: colors.danger },
  overwriteWarn: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 17,
  },

  /* create */
  createTitle: { marginTop: 12 },
  intro: { marginTop: 8, marginBottom: 8 },
  createScroll: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    gap: 10,
  },
  createFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: space.lg,
    paddingTop: 12,
    paddingBottom: 8,
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    backgroundColor: colors.bg,
  },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    // Evita que hijos con % height estiren la fila al infinito (bug Android).
    alignItems: 'flex-start',
  },
  gridItem: {
    width: '47%',
    flexGrow: 0,
    flexShrink: 0,
  },
  roleIntro: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  roleCard: { gap: 6, paddingVertical: 12 },
  roleHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  roleName: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 0.4,
  },
  rolePrimary: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    flexShrink: 1,
    textAlign: 'right',
  },
  roleDesc: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  roleStakes: {
    color: colors.gold,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.9,
  },
  summaryStakes: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  nationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    minHeight: 52,
  },
  nationName: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    flexShrink: 1,
  },
  selectionNote: { paddingVertical: 12 },
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
  endingCta: { marginTop: space.md, gap: 10 },
});
