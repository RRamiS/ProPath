import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { availableActivities, type WeekActivity } from '../engine/week';
import { activeObjectives, objectiveProgress } from '../engine/objectives';
import type { CareerState, Relations } from '../engine/types';
import { buildRoster } from '../content/esports/roster';
import { useGameStore } from '../store/gameStore';
import {
  Chip,
  IconBadge,
  LiveDot,
  Meter,
  Panel,
  PressCard,
  SectionHeader,
  Shutter,
  Tag,
} from '../ui/components';
import { CareerHud } from '../ui/CareerHud';
import { FadeSlide } from '../ui/motion';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import {
  colors,
  fonts,
  maxContentWidth,
  radius,
  SKEW,
  space,
  tones,
  UNSKEW,
  type Tone,
} from '../ui/theme';

const ACTIVITY_TONE: Record<string, Tone> = {
  soloq: 'accent',
  scrim: 'blue',
  vod: 'violet',
  rest: 'gold',
  content: 'warn',
  match: 'danger',
};

type EffectChip = { label: string; tone: Tone };

function activityChips(
  activity: WeekActivity,
  statLabels: Record<string, string>
): EffectChip[] {
  const out: EffectChip[] = Object.entries(activity.stats)
    .filter(([, v]) => typeof v === 'number' && v !== 0)
    .sort((a, b) => Math.abs(b[1] as number) - Math.abs(a[1] as number))
    .slice(0, 2)
    .map(([id, v]) => ({
      label: `${statLabels[id] ?? id} ${(v as number) > 0 ? '+' : '−'}${Math.abs(v as number)}`,
      tone: (v as number) > 0 ? ('accent' as Tone) : ('danger' as Tone),
    }));

  if (activity.fatigue !== 0) {
    out.push({
      label: `Fatiga ${activity.fatigue > 0 ? '+' : '−'}${Math.abs(activity.fatigue)}`,
      tone: activity.fatigue > 0 ? 'danger' : 'accent',
    });
  }

  return out;
}

/** Metas de sponsor: dan un “para qué” a la semana. */
function ObjectivesPanel({ career }: { career: CareerState }) {
  const objectives = activeObjectives(career);
  if (objectives.length === 0) return null;

  return (
    <Panel tone="gold" label="Objetivos" style={styles.block}>
      {objectives.map((o, i) => {
        const pct = objectiveProgress(o, career);
        return (
          <View key={o.id} style={[styles.objRow, i > 0 && styles.objRowGap]}>
            <View style={styles.objTop}>
              <Text style={styles.objLabel}>{o.label}</Text>
              <Text style={styles.objCount}>
                {Math.min(o.current(career), o.target)}/{o.target}
              </Text>
            </View>
            <Meter value={pct} tone="gold" height={4} />
            <View style={styles.objBottom}>
              <Text style={styles.objHint} numberOfLines={1}>
                {o.hint}
              </Text>
              <Text style={styles.objReward}>{o.rewardLabel}</Text>
            </View>
          </View>
        );
      })}
    </Panel>
  );
}

function RelationCard({
  name,
  role,
  value,
  tone,
}: {
  name: string;
  role: string;
  value: number;
  tone: Tone;
}) {
  const t = tones[tone];
  const mood = value >= 70 ? 'Sólido' : value >= 45 ? 'Neutral' : 'Frío';
  return (
    <View style={[styles.relCard, { borderColor: t.border }]}>
      <View style={[styles.relEdge, { backgroundColor: t.fg }]} />
      <View style={styles.relTop}>
        <View style={[styles.avatar, { borderColor: t.fg, backgroundColor: t.bg }]}>
          <Text style={[styles.avatarText, { color: t.fg }]}>{name.slice(0, 1)}</Text>
        </View>
        <View style={styles.relNames}>
          <Text style={styles.relName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.relRole} numberOfLines={1}>
            {role}
          </Text>
        </View>
        <View style={styles.relScore}>
          <Text style={[styles.relValue, { color: t.fg }]}>{value}</Text>
          <Text style={styles.relMood}>{mood}</Text>
        </View>
      </View>
      <Meter value={value} tone={tone} height={3} />
    </View>
  );
}

export function WeekHubScreen() {
  const pack = useGameStore((s) => s.pack);
  const career = useGameStore((s) => s.career);
  const pickActivity = useGameStore((s) => s.pickActivity);
  const reset = useGameStore((s) => s.reset);

  if (!career) return null;

  const activities = availableActivities(career, pack);
  const matchDay = activities.find((a) => a.id === 'match');
  const training = activities.filter((a) => a.id !== 'match');
  const roster = buildRoster(career.profile.nationId, career.profile.roleId);
  const stageOrder = pack.stages.find((s) => s.id === career.stageId)?.order ?? 1;

  const relationList: Array<{ key: keyof Relations; name: string; role: string; tone: Tone }> = [
    { key: 'coach', name: roster.coach.name, role: roster.coach.role, tone: 'accent' },
    { key: 'duo', name: roster.duo.name, role: roster.duo.role, tone: 'blue' },
    { key: 'rival', name: roster.rival.name, role: roster.rival.role, tone: 'danger' },
  ];
  if (stageOrder >= 3) {
    relationList.push({
      key: 'manager',
      name: roster.manager.name,
      role: roster.manager.role,
      tone: 'gold',
    });
  }

  const tired = career.fatigue >= 70;

  return (
    <View style={styles.root}>
      <MobaBackdrop intensity="play" stageId={career.stageId} />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <FadeSlide key={`hub-${career.turn}`}>
            <CareerHud career={career} pack={pack} onExit={reset} />

            {career.lastNotice ? (
              <Shutter>
                <Panel tone="accent" glow label="Parte semanal" style={styles.block}>
                  <Text style={styles.noticeText}>{career.lastNotice}</Text>
                </Panel>
              </Shutter>
            ) : null}

            {tired ? (
              <Panel tone="danger" glow label="Alerta física" style={styles.block}>
                <Text style={styles.warningText}>
                  Fatiga {career.fatigue}. Cada semana extra te come forma y mentalidad.
                </Text>
              </Panel>
            ) : null}

            <ObjectivesPanel career={career} />

            <SectionHeader
              eyebrow="Esta semana"
              title="¿Dónde invertís?"
              right={<Tag label={`${career.maxTurns - career.turn} restantes`} tone="muted" />}
            />

            {matchDay ? (
              <FadeSlide delay={20}>
                <PressCard
                  tone="danger"
                  onPress={() => pickActivity('match')}
                  style={styles.matchCard}
                >
                  <View style={styles.matchTop}>
                    <View style={styles.matchLive}>
                      <LiveDot />
                      <Text style={styles.matchLiveText}>EN VIVO</Text>
                    </View>
                    <View style={styles.matchPhases}>
                      <Text style={styles.matchPhasesText}>4 FASES</Text>
                    </View>
                  </View>

                  <Text style={styles.matchTitle}>{matchDay.label}</Text>
                  <Text style={styles.matchBlurb}>{matchDay.blurb}</Text>

                  <View style={styles.matchFoot}>
                    <Text style={styles.matchFootText}>
                      Forma {Math.round(career.form)} · Fatiga {Math.round(career.fatigue)} ·
                      Duo {career.relations.duo}
                    </Text>
                    <View style={styles.goSlab}>
                      <Text style={styles.goSlabText}>JUGAR</Text>
                    </View>
                  </View>
                </PressCard>
              </FadeSlide>
            ) : null}

            <View style={styles.grid}>
              {training.map((a, i) => {
                const tone = ACTIVITY_TONE[a.id] ?? 'accent';
                return (
                  <FadeSlide key={a.id} delay={40 + i * 40} style={styles.gridItem}>
                    <PressCard
                      onPress={() => pickActivity(a.id)}
                      tone={tone}
                      style={styles.activityCard}
                    >
                      <View style={styles.activityHead}>
                        <IconBadge name={a.id} tone={tone} size={34} />
                        <Text style={styles.activityLabel} numberOfLines={2}>
                          {a.label}
                        </Text>
                      </View>
                      <Text style={styles.activityBlurb} numberOfLines={3}>
                        {a.blurb}
                      </Text>
                      <View style={styles.chipRow}>
                        {activityChips(a, pack.statLabels).map((c) => (
                          <Chip key={c.label} label={c.label} tone={c.tone} />
                        ))}
                      </View>
                    </PressCard>
                  </FadeSlide>
                );
              })}
            </View>

            <SectionHeader eyebrow="Círculo" title="Gente que te sostiene" tone="blue" />
            <View style={styles.relGrid}>
              {relationList.map((r) => (
                <RelationCard
                  key={r.key}
                  name={r.name}
                  role={r.role}
                  value={career.relations[r.key]}
                  tone={r.tone}
                />
              ))}
            </View>

            <Text style={styles.footHint}>
              La forma sube compitiendo y baja con la fatiga. Las relaciones cambian cómo te
              tratan los eventos y cuánto rinde el equipo en la serie.
            </Text>
          </FadeSlide>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scrollFlex: { flex: 1 },
  scroll: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xxl,
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
  },
  block: { marginBottom: 14 },
  noticeText: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.bodySemi,
  },
  warningText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.bodySemi,
  },

  /* objetivos */
  objRow: { gap: 6 },
  objRowGap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  objTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  objLabel: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  objCount: {
    color: colors.gold,
    fontFamily: fonts.displaySemi,
    fontSize: 14,
  },
  objBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  objHint: {
    flex: 1,
    color: colors.faint,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  objReward: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },

  /* match day */
  matchCard: { marginBottom: 12, padding: 16, paddingLeft: 18 },
  matchTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  matchLive: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  matchLiveText: {
    color: colors.danger,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
  },
  matchPhases: {
    backgroundColor: 'rgba(255,59,92,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    transform: [{ skewX: SKEW }],
  },
  matchPhasesText: {
    color: colors.danger,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    transform: [{ skewX: UNSKEW }],
  },
  matchTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.9,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  matchBlurb: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  matchFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,59,92,0.25)',
  },
  matchFootText: {
    flex: 1,
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  goSlab: {
    backgroundColor: colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 6,
    transform: [{ skewX: SKEW }],
  },
  goSlabText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.6,
    transform: [{ skewX: UNSKEW }],
  },

  /* actividades */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 150,
  },
  activityCard: {
    height: '100%',
    gap: 9,
  },
  activityHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityLabel: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    lineHeight: 18,
  },
  activityBlurb: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },

  /* relaciones */
  relGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  relCard: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 150,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: 12,
    paddingLeft: 14,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
    overflow: 'hidden',
  },
  relEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
  },
  relTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.display,
    fontSize: 14,
  },
  relNames: { flex: 1 },
  relName: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  relRole: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
  },
  relScore: { alignItems: 'flex-end' },
  relValue: {
    fontFamily: fonts.displaySemi,
    fontSize: 14,
  },
  relMood: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    letterSpacing: 1,
  },
  footHint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: space.lg,
    color: colors.faint,
    fontFamily: fonts.body,
  },
});
