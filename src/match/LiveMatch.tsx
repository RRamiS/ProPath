import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { ArenaScene } from './ArenaScene';
import {
  buildMatchBeats,
  feedLine,
  MATCH_PHASE_LABELS,
  momentumWinChance,
  pickOpponent,
  type MatchChoice,
} from './simulate';
import type { MatchFactor, MatchResult } from '../engine/types';
import {
  BigNumber,
  Body,
  Button,
  Chip,
  Panel,
  PopIn,
  PressCard,
  Stepper,
  Tag,
} from '../ui/components';
import { FadeSlide } from '../ui/motion';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import type { InteractVerb } from '../engine/interact';
import { VerbChallenge } from '../ui/VerbChallenge';
import { buzzMatch } from '../ui/feedback';
import {
  colors,
  fonts,
  maxContentWidth,
  radius,
  SKEW,
  space,
  springs,
  UNSKEW,
} from '../ui/theme';

function phaseSkill(phase: string): { verb: InteractVerb; blurb: string; sortItems?: string[] } {
  switch (phase) {
    case 'draft':
      return {
        verb: 'sort',
        blurb: 'Ordená prioridades de draft. Si fallás el ritmo, el rival toma prio.',
        sortItems: ['Ban peligro', 'Prio early', 'Flex', 'Comfort'],
      };
    case 'early':
      return {
        verb: 'timing',
        blurb: 'Timing de lane. Soltá mal y el impulso se va al otro lado.',
      };
    case 'fight':
      return {
        verb: 'tap',
        blurb: 'Ventana de pelea. Tocá en verde o el fight se rompe.',
      };
    default:
      return {
        verb: 'react',
        blurb: 'Cierre bajo presión. Esperá la señal y tocá en el momento.',
      };
  }
}

/** Barra de impulso bajo el diorama — los sprites viven en ArenaScene. */
function MomentumBar({
  momentum,
  winChance,
  subtitle,
  flash,
}: {
  momentum: SharedValue<number>;
  winChance: number;
  subtitle: string;
  flash: 'up' | 'down' | null;
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!flash) return;
    pulse.value = withSequence(
      withSpring(1.04, springs.bouncy),
      withSpring(1, springs.snappy)
    );
  }, [flash, pulse]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${momentum.value}%`,
  }));
  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const edge =
    flash === 'up' ? colors.accent : flash === 'down' ? colors.danger : colors.danger;

  return (
    <Animated.View style={[styles.broadcast, wrapStyle]}>
      <View style={[styles.broadcastEdge, { backgroundColor: edge }]} />
      <View style={styles.momTrack}>
        <Animated.View
          style={[
            styles.momFill,
            barStyle,
            flash === 'up' && { backgroundColor: colors.accent },
            flash === 'down' && { backgroundColor: colors.danger },
          ]}
        />
        <View style={styles.momCenter} />
      </View>
      <View style={styles.momLabels}>
        <Text style={[styles.momLabel, { color: colors.accent }]}>IMPULSO</Text>
        <Text
          style={[
            styles.momChance,
            flash === 'up' && { color: colors.accent },
            flash === 'down' && { color: colors.danger },
          ]}
        >
          {flash === 'up' ? '▲ ' : flash === 'down' ? '▼ ' : ''}~{winChance}% ganar
        </Text>
        <Text style={[styles.momLabel, { color: colors.danger }]}>PRESIÓN RIVAL</Text>
      </View>
      <Text style={styles.formLine}>{subtitle}</Text>
    </Animated.View>
  );
}

function ScoreCell({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <View style={styles.scoreCell}>
      <BigNumber value={value} style={[styles.scoreValue, { color: tone }]} duration={620} />
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

/**
 * Desglose del resultado. Es lo que más se pide en los foros de manager:
 * ver qué pesó de verdad en la serie, no solo el marcador.
 */
function FactorRow({ factor, max, delay }: { factor: MatchFactor; max: number; delay: number }) {
  const positive = factor.value > 0;
  const width = `${Math.min(50, (Math.abs(factor.value) / max) * 50)}%` as const;

  return (
    <PopIn delay={delay}>
      <View style={styles.factorRow}>
        <Text style={styles.factorLabel} numberOfLines={1}>
          {factor.label}
        </Text>
        <View style={styles.factorTrack}>
          <View style={styles.factorCenter} />
          <View
            style={[
              styles.factorBar,
              positive
                ? { left: '50%', width, backgroundColor: colors.accent }
                : { right: '50%', width, backgroundColor: colors.danger },
            ]}
          />
        </View>
        <Text
          style={[styles.factorValue, { color: positive ? colors.accent : colors.danger }]}
        >
          {positive ? '+' : ''}
          {factor.value.toFixed(2)}
        </Text>
      </View>
    </PopIn>
  );
}

function MatchResultView({
  result,
  form,
  onContinue,
}: {
  result: MatchResult;
  form: number;
  onContinue: () => void;
}) {
  const tone = result.won ? colors.accent : colors.danger;
  const maxFactor = Math.max(0.4, ...result.factors.map((f) => Math.abs(f.value)));
  const total = result.factors.reduce((s, f) => s + f.value, 0);

  useEffect(() => {
    buzzMatch(result.won);
  }, [result.won, result.opponent, result.scoreLine]);

  return (
    <FadeSlide>
      <PopIn>
        <View style={[styles.resultCard, { borderColor: tone }]}>
          <View style={[styles.resultEdge, { backgroundColor: tone }]} />
          <View style={[styles.resultTab, { backgroundColor: tone }]}>
            <Text style={styles.resultTabText}>{result.won ? 'VICTORIA' : 'DERROTA'}</Text>
          </View>

          <Text style={styles.resultScore}>{result.scoreLine}</Text>
          <Text style={styles.resultOpp}>vs {result.opponent}</Text>

          {result.mvp ? (
            <PopIn delay={220} style={styles.mvpWrap}>
              <Tag label="MVP DE LA SERIE" tone="gold" solid />
            </PopIn>
          ) : null}
        </View>
      </PopIn>

      <PopIn delay={120}>
        <Panel style={styles.kdaCard} ticks={false}>
          <View style={styles.kdaRow}>
            <ScoreCell value={result.kills} label="KILLS" tone={colors.accent} />
            <View style={styles.kdaDivider} />
            <ScoreCell value={result.deaths} label="MUERTES" tone={colors.danger} />
            <View style={styles.kdaDivider} />
            <ScoreCell value={result.assists} label="ASIST." tone={colors.blue} />
            <View style={styles.kdaDivider} />
            <ScoreCell value={Math.round(form)} label="FORMA" tone={colors.gold} />
          </View>
        </Panel>
      </PopIn>

      <Panel
        tone={result.won ? 'accent' : 'danger'}
        label="Por qué pasó"
        style={styles.factorPanel}
      >
        {result.factors.map((f, i) => (
          <FactorRow key={f.label} factor={f} max={maxFactor} delay={180 + i * 70} />
        ))}
        <View style={styles.factorTotal}>
          <Text style={styles.factorTotalLabel}>BALANCE FINAL</Text>
          <Text style={[styles.factorTotalValue, { color: tone }]}>
            {total > 0 ? '+' : ''}
            {total.toFixed(2)}
          </Text>
        </View>
        <Text style={styles.factorHint}>
          Por encima de +0.25 ganás la serie. Todo lo que ves acá lo movés vos entre semana.
        </Text>
      </Panel>

      {result.highlights.length > 0 ? (
        <>
          <Text style={styles.highlightsTitle}>HIGHLIGHTS</Text>
          {result.highlights.map((h, i) => (
            <PopIn key={`${h}-${i}`} delay={320 + i * 90}>
              <View style={styles.highlightRow}>
                <View style={[styles.highlightDot, { backgroundColor: tone }]} />
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            </PopIn>
          ))}
        </>
      ) : null}

      <View style={styles.resultCta}>
        <Button label="Seguir la semana" onPress={onContinue} />
      </View>
    </FadeSlide>
  );
}

export function LiveMatchScreen() {
  const career = useGameStore((s) => s.career);
  const matchPhase = useGameStore((s) => s.matchPhase);
  const resolveLiveMatch = useGameStore((s) => s.resolveLiveMatch);
  const continueAfterMatch = useGameStore((s) => s.continueAfterMatch);

  const roleId = career?.profile.roleId ?? 'mid';
  const beats = useMemo(() => buildMatchBeats(roleId), [roleId]);

  const opponentSeed = career?.rngSeed ?? 0;
  const stageId = career?.stageId ?? 'soloq';
  const liveOpponent = useMemo(
    () => pickOpponent(opponentSeed, stageId).name,
    // El rival se fija al entrar al partido y no cambia entre fases.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stageId]
  );

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [feed, setFeed] = useState<string[]>(['Cámaras encendidas · draft en curso']);
  const [momValue, setMomValue] = useState(50);
  const [skill, setSkill] = useState<MatchChoice | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const momentum = useSharedValue(50);

  if (!career) return null;

  const showingResult = matchPhase === 'result' && career.lastMatch;
  const opponent = showingResult ? career.lastMatch!.opponent : liveOpponent;
  const beat = beats[phaseIndex];
  const winChance = momentumWinChance(momValue);

  const applyPick = (choiceId: string, momDelta: number) => {
    const nextChoices = [...choices, choiceId];
    setChoices(nextChoices);
    setFeed((f) => [...f, feedLine(phaseIndex, choiceId)].slice(-5));
    const nextMom = Math.max(5, Math.min(95, momValue + momDelta * 13));
    setMomValue(nextMom);
    momentum.value = withSpring(nextMom, springs.progress);
    setFlash(momDelta >= 0 ? 'up' : 'down');
    setTimeout(() => setFlash(null), 700);

    if (phaseIndex + 1 >= beats.length) {
      resolveLiveMatch(nextChoices, liveOpponent, nextMom);
      return;
    }
    setPhaseIndex((p) => p + 1);
  };

  const onPick = (choice: MatchChoice) => {
    // Jugadas agresivas piden un skill check: fallar baja el impulso.
    if (choice.momentum >= 1) {
      setSkill(choice);
      return;
    }
    applyPick(choice.id, choice.momentum);
  };

  const livePhase = beat?.phase ?? 'draft';

  return (
    <View style={styles.root}>
      <MobaBackdrop intensity="cinematic" stageId="arena" />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ArenaScene
            phase={showingResult ? 'late' : livePhase}
            momentum={momentum}
            playerName={career.profile.name}
            opponent={opponent}
            won={showingResult ? career.lastMatch!.won : null}
            night={career.daypart === 'night'}
          />

          <MomentumBar
            momentum={momentum}
            winChance={winChance}
            flash={flash}
            subtitle={
              showingResult
                ? `Récord ${career.wins}V · ${career.losses}D`
                : `Forma ${Math.round(career.form)} pesa acá · Fatiga ${Math.round(career.fatigue)}`
            }
          />

          <View style={styles.stepperWrap}>
            <Stepper
              steps={MATCH_PHASE_LABELS}
              current={showingResult ? MATCH_PHASE_LABELS.length : phaseIndex}
              tone="danger"
            />
          </View>

          {showingResult ? (
            <MatchResultView
              result={career.lastMatch!}
              form={career.form}
              onContinue={continueAfterMatch}
            />
          ) : skill && beat ? (
            <FadeSlide key={`skill-${skill.id}-${beat.phase}`}>
              <Text style={styles.skillTitle}>
                EJECUTAR · {beat.phase.toUpperCase()}
              </Text>
              <Text style={styles.beatBody}>
                Elegiste “{skill.label}”. {phaseSkill(beat.phase).blurb}
              </Text>
              <VerbChallenge
                verb={phaseSkill(beat.phase).verb}
                label={skill.hint ?? skill.label}
                sortItems={phaseSkill(beat.phase).sortItems}
                onDone={(ok) => {
                  const choice = skill;
                  const phase = beat.phase;
                  setSkill(null);
                  if (ok) {
                    setFeed((f) => [...f, `Play limpio · ${phase}`].slice(-5));
                    applyPick(choice.id, choice.momentum);
                  } else {
                    // Fallar duele más en fight/cierre.
                    const punish = phase === 'late' || phase === 'fight' ? -3 : -2;
                    setFeed((f) => [...f, `Fallaste · presión rival (${phase})`].slice(-5));
                    applyPick(choice.id, punish);
                  }
                }}
              />
            </FadeSlide>
          ) : (
            <>
              <View style={styles.feed}>
                {feed.map((line, i) => (
                  <Text key={`${line}-${i}`} style={styles.feedLine} numberOfLines={1}>
                    › {line}
                  </Text>
                ))}
              </View>

              {beat ? (
                <FadeSlide key={beat.phase}>
                  <View style={styles.phaseRow}>
                    <Tag label={`FASE ${phaseIndex + 1}/${beats.length}`} tone="danger" solid />
                    <Text style={styles.phaseName}>{beat.title.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.beatBody}>{beat.body}</Text>

                  {beat.choices.map((c, i) => (
                    <FadeSlide key={c.id} delay={i * 45}>
                      <PressCard
                        onPress={() => onPick(c)}
                        tone={c.momentum > 0 ? 'accent' : c.momentum < 0 ? 'danger' : 'muted'}
                        style={styles.choice}
                      >
                        <View style={styles.choiceRow}>
                          <View style={styles.choiceText}>
                            <Text style={styles.choiceLabel}>{c.label}</Text>
                            {c.hint ? <Text style={styles.choiceHint}>{c.hint}</Text> : null}
                            {c.momentum >= 1 ? (
                              <Text style={styles.choiceHint}>
                                Skill · {phaseSkill(beat.phase).verb}
                              </Text>
                            ) : null}
                          </View>
                          <Chip
                            label={
                              c.momentum > 0
                                ? `+${c.momentum} impulso`
                                : c.momentum < 0
                                  ? `${c.momentum} impulso`
                                  : 'Neutral'
                            }
                            tone={c.momentum > 0 ? 'accent' : c.momentum < 0 ? 'danger' : 'muted'}
                          />
                        </View>
                      </PressCard>
                    </FadeSlide>
                  ))}
                </FadeSlide>
              ) : (
                <Body>Resolviendo resultado…</Body>
              )}
            </>
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
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
  },

  broadcast: {
    backgroundColor: 'rgba(8,10,14,0.94)',
    borderRadius: radius.md,
    padding: 16,
    paddingLeft: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.32)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  broadcastEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,59,92,0.2)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    transform: [{ skewX: SKEW }],
  },
  liveTagText: {
    color: colors.danger,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.8,
    transform: [{ skewX: UNSKEW }],
  },
  network: {
    marginLeft: 'auto',
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 2,
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  vsSide: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  vsSprite: {
    width: 36,
    height: 48,
  },
  teamUs: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  vsSlab: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: 7,
    paddingVertical: 2,
    transform: [{ skewX: SKEW }],
  },
  vs: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.4,
    transform: [{ skewX: UNSKEW }],
  },
  teamThem: {
    textAlign: 'center',
    color: colors.danger,
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  momTrack: {
    height: 8,
    backgroundColor: 'rgba(255,59,92,0.28)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  momFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.accent,
  },
  momCenter: {
    position: 'absolute',
    left: '50%',
    width: 1.5,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  momLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  momLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    letterSpacing: 1.4,
  },
  momChance: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  formLine: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    marginTop: 10,
  },
  skillTitle: {
    color: colors.danger,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.6,
    marginBottom: 8,
  },

  stepperWrap: { marginBottom: 16 },

  feed: {
    backgroundColor: colors.bgSunken,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 3,
  },
  feedLine: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 18,
  },

  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  phaseName: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: -0.6,
  },
  beatBody: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  choice: { marginBottom: 10 },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  choiceText: { flex: 1 },
  choiceLabel: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  choiceHint: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 3,
  },

  /* resultado */
  resultCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 9,
    marginBottom: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'visible',
  },
  resultEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  resultTab: {
    position: 'absolute',
    top: -9,
    left: 14,
    paddingHorizontal: 11,
    paddingVertical: 3,
    transform: [{ skewX: SKEW }],
  },
  resultTabText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    transform: [{ skewX: UNSKEW }],
  },
  resultScore: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 50,
    lineHeight: 56,
    letterSpacing: -2,
  },
  resultOpp: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    marginTop: 2,
  },
  mvpWrap: { marginTop: 14 },

  kdaCard: { paddingVertical: 14, marginBottom: 14 },
  kdaRow: { flexDirection: 'row', alignItems: 'center' },
  kdaDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.line,
  },
  scoreCell: { flex: 1, alignItems: 'center' },
  scoreValue: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -1,
  },
  scoreLabel: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    letterSpacing: 1.4,
    marginTop: 3,
  },

  /* desglose */
  factorPanel: { marginBottom: 18 },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  factorLabel: {
    width: 108,
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 11.5,
  },
  factorTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(235,240,248,0.05)',
    justifyContent: 'center',
  },
  factorCenter: {
    position: 'absolute',
    left: '50%',
    width: 1,
    top: 0,
    bottom: 0,
    backgroundColor: colors.lineStrong,
  },
  factorBar: {
    position: 'absolute',
    top: 1,
    bottom: 1,
  },
  factorValue: {
    width: 42,
    textAlign: 'right',
    fontFamily: fonts.displaySemi,
    fontSize: 12,
  },
  factorTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  factorTotalLabel: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 1.6,
  },
  factorTotalValue: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: -0.6,
  },
  factorHint: {
    color: colors.faint,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },

  highlightsTitle: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 1.8,
    marginBottom: 10,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  highlightDot: { width: 6, height: 6, transform: [{ rotate: '45deg' }] },
  highlightText: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    flex: 1,
  },
  resultCta: { marginTop: space.lg },
});
