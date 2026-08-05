import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activeObjectives, objectiveProgress } from '../engine/objectives';
import {
  currentPerk,
  nextPerk,
  rankProgress,
  relationRank,
  MAX_RANK,
  type RelationKey,
} from '../engine/relations';
import { activityImpact, getActivity, isMatchWeek } from '../engine/week';
import type { CareerState, Relations } from '../engine/types';
import { buildRoster } from '../content/esports/roster';
import { ActionSheet } from '../room/ActionSheet';
import { ROOM_NAMES } from '../room/layout';
import { RoomScene, roomSlots, type RoomSlot } from '../room/RoomScene';
import { useGameStore } from '../store/gameStore';
import { agePressure } from '../engine/season';
import { getVenue, npcLine } from '../engine/venues';
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

/**
 * Planificador de la semana. Robado de los "dayparts" de Persona: dos bloques,
 * dos decisiones, y ver el hueco vacío obliga a pensar antes de gastarlo.
 */
function DaypartStrip({ career, matchWeek }: { career: CareerState; matchWeek: boolean }) {
  const night = career.daypart === 'night';
  const doneLabel = night && career.lastActivity ? getActivity(career.lastActivity).label : null;

  const blocks = [
    { id: 'day', label: 'DÍA', done: night, fill: doneLabel },
    { id: 'night', label: 'NOCHE', done: false, fill: null },
  ];

  return (
    <View style={styles.plannerWrap}>
      <View style={styles.dayparts}>
        {blocks.map((b) => {
          const active = (b.id === 'night') === night;
          return (
            <View
              key={b.id}
              style={[styles.dpBlock, active && styles.dpBlockActive, b.done && styles.dpBlockDone]}
            >
              <View style={styles.dpHead}>
                <Text style={[styles.dpLabel, active && styles.dpLabelActive]}>{b.label}</Text>
                {active ? <LiveDot /> : null}
              </View>
              <Text style={[styles.dpFill, b.done && styles.dpFillDone]} numberOfLines={1}>
                {b.done ? (b.fill ?? 'Hecho') : active ? 'Elegí un objeto' : 'Pendiente'}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.fixture, matchWeek && styles.fixtureLive]}>
        <Text style={[styles.fixtureLabel, matchWeek && styles.fixtureLabelLive]}>
          {matchWeek ? 'SERIE ESTA SEMANA' : 'SEMANA SIN SERIE'}
        </Text>
        <Text style={styles.fixtureHint} numberOfLines={1}>
          {matchWeek
            ? 'Si no salís por la puerta, igual se juega al cierre.'
            : 'Ventana para construir: forma, cabeza y vínculos.'}
        </Text>
      </View>
    </View>
  );
}

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

/** Relación con rango y perk: el número solo no dice nada, el perk sí. */
function RelationCard({
  kind,
  name,
  role,
  value,
  tone,
}: {
  kind: RelationKey;
  name: string;
  role: string;
  value: number;
  tone: Tone;
}) {
  const t = tones[tone];
  const rank = relationRank(value);
  const perk = currentPerk(kind, value);
  const next = nextPerk(kind, value);

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
        <View style={styles.rankPips}>
          {Array.from({ length: MAX_RANK }, (_, i) => (
            <View
              key={i}
              style={[
                styles.rankPip,
                { backgroundColor: i < rank ? t.fg : 'rgba(235,240,248,0.12)' },
              ]}
            />
          ))}
        </View>
      </View>

      <Meter value={rankProgress(value)} tone={tone} height={3} />

      <Text style={[styles.relPerk, { color: perk ? t.fg : colors.faint }]} numberOfLines={2}>
        {perk ? `R${rank} · ${perk.label}` : 'Sin rango todavía'}
      </Text>
      <Text style={styles.relNext} numberOfLines={2}>
        {next ? `+${next.missing} para ${next.perk.label}` : 'Rango máximo'}
      </Text>
    </View>
  );
}

/** Vista lista: misma información, cero escenografía. Para ir rápido. */
function ActivityList({
  slots,
  onPick,
  statLabels,
  career,
}: {
  slots: RoomSlot[];
  onPick: (s: RoomSlot) => void;
  statLabels: Record<string, string>;
  career: CareerState;
}) {
  return (
    <View style={styles.grid}>
      {slots
        .filter((s) => s.available)
        .map((slot, i) => {
          const impact = activityImpact(slot.activity, career.daypart);
          return (
            <FadeSlide key={slot.activity.id} delay={30 + i * 30} style={styles.gridItem}>
              <PressCard onPress={() => onPick(slot)} tone={slot.tone} style={styles.activityCard}>
                <View style={styles.activityHead}>
                  <IconBadge name={slot.activity.id} tone={slot.tone} size={34} />
                  <Text style={styles.activityLabel} numberOfLines={2}>
                    {slot.activity.label}
                  </Text>
                </View>
                <Text style={styles.activityBlurb} numberOfLines={3}>
                  {slot.activity.blurb}
                </Text>
                <View style={styles.chipRow}>
                  {Object.entries(impact.stats)
                    .filter(([, v]) => typeof v === 'number' && v !== 0)
                    .slice(0, 2)
                    .map(([id, v]) => (
                      <Chip
                        key={id}
                        label={`${statLabels[id] ?? id} ${(v as number) > 0 ? '+' : '−'}${Math.abs(
                          v as number
                        )}`}
                        tone={(v as number) > 0 ? 'accent' : 'danger'}
                      />
                    ))}
                  {impact.fatigue !== 0 ? (
                    <Chip
                      label={`Fatiga ${impact.fatigue > 0 ? '+' : '−'}${Math.abs(impact.fatigue)}`}
                      tone={impact.fatigue > 0 ? 'danger' : 'accent'}
                    />
                  ) : null}
                </View>
              </PressCard>
            </FadeSlide>
          );
        })}
    </View>
  );
}

export function WeekHubScreen() {
  const pack = useGameStore((s) => s.pack);
  const career = useGameStore((s) => s.career);
  const pickActivity = useGameStore((s) => s.pickActivity);
  const reset = useGameStore((s) => s.reset);
  const setScreen = useGameStore((s) => s.setScreen);
  const talkToNpc = useGameStore((s) => s.talkToNpc);
  const clearNpcTalk = useGameStore((s) => s.clearNpcTalk);
  const npcTalk = useGameStore((s) => s.npcTalk);
  const retireCareer = useGameStore((s) => s.retireCareer);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listView, setListView] = useState(false);

  const daypart = career?.daypart;
  const turn = career?.turn;
  const venueId = career?.venueId;
  useEffect(() => {
    setSelectedId(null);
  }, [daypart, turn, venueId]);

  if (!career) return null;

  const slots = roomSlots(career, pack);
  const selected = slots.find((s) => s.spec.id === selectedId) ?? null;
  const roster = buildRoster(career.profile.nationId, career.profile.roleId);
  const stageOrder = pack.stages.find((s) => s.id === career.stageId)?.order ?? 1;
  const tired = career.fatigue >= 70;
  const pressure = agePressure(career.ageYears);
  const venue = getVenue(career.venueId);

  const relationList: Array<{ key: RelationKey; name: string; role: string; tone: Tone }> = [
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

  const commit = (slot: RoomSlot) => {
    setSelectedId(null);
    pickActivity(slot.activity.id);
  };

  return (
    <View style={styles.root}>
      <MobaBackdrop intensity="play" stageId={career.stageId} />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <FadeSlide key={`hub-${career.turn}-${career.daypart}-${career.venueId}`}>
            <CareerHud career={career} pack={pack} onExit={reset} />

            {career.lastNotice ? (
              <Shutter>
                <Panel tone="accent" glow label="Parte" style={styles.block}>
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

            {pressure.label ? (
              <Panel tone={pressure.hard ? 'danger' : 'warn'} label="Edad" style={styles.block}>
                <Text style={styles.warningText}>{pressure.label}</Text>
              </Panel>
            ) : null}

            {npcTalk ? (
              <Panel tone="blue" label="Conversación" style={styles.block}>
                <Text style={styles.noticeText}>{npcTalk}</Text>
                <Pressable onPress={clearNpcTalk} style={styles.dismissTalk}>
                  <Text style={styles.dismissTalkText}>Cerrar</Text>
                </Pressable>
              </Panel>
            ) : null}

            <DaypartStrip career={career} matchWeek={isMatchWeek(career, pack)} />

            <View style={styles.roomHead}>
              <View style={styles.roomTitleWrap}>
                <Text style={styles.roomEyebrow}>
                  {career.daypart === 'night' ? 'NOCHE' : 'DÍA'} · {venue.label.toUpperCase()}
                </Text>
                <Text style={styles.roomTitle}>
                  {career.venueId === 'home'
                    ? ROOM_NAMES[career.stageId] ?? 'Tu pieza'
                    : venue.label}
                </Text>
              </View>
              <View style={styles.headActions}>
                <Pressable style={styles.viewToggle} onPress={() => setScreen('city')}>
                  <Text style={styles.viewToggleText}>MAPA</Text>
                </Pressable>
                <Pressable style={styles.viewToggle} onPress={() => setScreen('shop')}>
                  <Text style={styles.viewToggleText}>SHOP</Text>
                </Pressable>
                <Pressable
                  style={styles.viewToggle}
                  onPress={() => {
                    setSelectedId(null);
                    setListView((v) => !v);
                  }}
                >
                  <Text style={styles.viewToggleText}>{listView ? 'SALA' : 'LISTA'}</Text>
                </Pressable>
              </View>
            </View>

            {listView ? (
              <ActivityList
                slots={slots}
                career={career}
                statLabels={pack.statLabels}
                onPick={commit}
              />
            ) : (
              <View style={styles.roomWrap}>
                <RoomScene
                  career={career}
                  pack={pack}
                  slots={slots}
                  selectedId={selectedId}
                  onSelect={(s) => {
                    clearNpcTalk();
                    setSelectedId(s.spec.id);
                  }}
                  onNpc={(npc) => {
                    setSelectedId(null);
                    talkToNpc(npcLine(npc.kind, career.daypart, career.rngSeed + npc.kind.length));
                  }}
                />
                {selected ? (
                  <ActionSheet
                    slot={selected}
                    career={career}
                    pack={pack}
                    onConfirm={() => commit(selected)}
                    onCancel={() => setSelectedId(null)}
                  />
                ) : (
                  <View style={styles.hintBar}>
                    <Text style={styles.hintText}>
                      Tocá un objeto o una persona. El avatar camina hacia ahí.
                    </Text>
                    <Text style={styles.hintCount}>
                      {slots.filter((s) => s.available).length} acciones
                    </Text>
                  </View>
                )}
              </View>
            )}

            <ObjectivesPanel career={career} />

            <SectionHeader
              eyebrow="Círculo"
              title="Gente que te sostiene"
              tone="blue"
              right={<Tag label={`T${career.season}`} tone="muted" />}
            />
            <View style={styles.relGrid}>
              {relationList.map((r) => (
                <RelationCard
                  key={r.key}
                  kind={r.key}
                  name={r.name}
                  role={r.role}
                  value={career.relations[r.key as keyof Relations]}
                  tone={r.tone}
                />
              ))}
            </View>

            {pressure.soft ? (
              <Pressable onPress={retireCareer} style={styles.retireLink}>
                <Text style={styles.retireLinkText}>Retirarme ahora</Text>
              </Pressable>
            ) : null}

            <Text style={styles.footHint}>
              Carrera continua: temporadas sin hard end. Viajá por el mapa, mejorá el setup y
              hablá con tu gente. A los 35 el circuito empieza a apretar.
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

  /* dayparts */
  plannerWrap: { marginBottom: 12, gap: 6 },
  dayparts: { flexDirection: 'row', gap: 8 },
  dpBlock: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 11,
    paddingVertical: 8,
    gap: 3,
  },
  dpBlockActive: { borderColor: 'rgba(204,255,51,0.45)', backgroundColor: colors.accentSoft },
  dpBlockDone: { opacity: 0.6 },
  dpHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dpLabel: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 1.6,
  },
  dpLabelActive: { color: colors.accent },
  dpFill: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 11.5,
  },
  dpFillDone: { color: colors.faint, textDecorationLine: 'line-through' },
  fixture: {
    borderLeftWidth: 2,
    borderLeftColor: colors.line,
    paddingLeft: 9,
    paddingVertical: 2,
    gap: 1,
  },
  fixtureLive: { borderLeftColor: colors.danger },
  fixtureLabel: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 1.5,
  },
  fixtureLabelLive: { color: colors.danger },
  fixtureHint: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 11,
  },

  /* sala */
  roomHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 10,
  },
  roomTitleWrap: { flex: 1 },
  roomEyebrow: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 1.8,
  },
  roomTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.8,
    textTransform: 'uppercase',
  },
  headActions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
  viewToggle: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    paddingHorizontal: 8,
    paddingVertical: 5,
    transform: [{ skewX: SKEW }],
  },
  viewToggleText: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    transform: [{ skewX: UNSKEW }],
  },
  dismissTalk: { alignSelf: 'flex-start', marginTop: 8 },
  dismissTalkText: {
    color: colors.blue,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  retireLink: { marginTop: 16, alignSelf: 'center', padding: 8 },
  retireLinkText: {
    color: colors.danger,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
  },
  roomWrap: { marginBottom: 16 },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hintText: {
    flex: 1,
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  hintCount: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.6,
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
  objLabel: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 14 },
  objCount: { color: colors.gold, fontFamily: fonts.displaySemi, fontSize: 14 },
  objBottom: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  objHint: { flex: 1, color: colors.faint, fontFamily: fonts.body, fontSize: 11 },
  objReward: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },

  /* lista */
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  gridItem: { flexGrow: 1, flexBasis: '46%', minWidth: 150 },
  activityCard: { height: '100%', gap: 9 },
  activityHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },

  /* relaciones */
  relGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
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
    gap: 8,
    overflow: 'hidden',
  },
  relEdge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 2 },
  relTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 14 },
  relNames: { flex: 1 },
  relName: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 },
  relRole: { color: colors.faint, fontFamily: fonts.bodyMedium, fontSize: 10 },
  rankPips: { flexDirection: 'row', gap: 2.5 },
  rankPip: { width: 5, height: 5, transform: [{ skewX: SKEW }] },
  relPerk: { fontFamily: fonts.bodyBold, fontSize: 11 },
  relNext: { color: colors.faint, fontFamily: fonts.body, fontSize: 10, lineHeight: 14 },

  footHint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: space.lg,
    color: colors.faint,
    fontFamily: fonts.body,
  },
});
