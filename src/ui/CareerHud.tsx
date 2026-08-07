import { Pressable, StyleSheet, Text, View } from 'react-native';
import { objectiveProgress, primaryObjective } from '../engine/objectives';
import { masteryTierLabel, roleMasteryOf } from '../engine/role';
import type { CareerState, ContentPack } from '../engine/types';
import { Gauge, SeasonStrip } from './components';
import { NationBadge } from './NationBadge';
import { Ticker } from './Ticker';
import { colors, fonts, radius, SKEW, space, stageTone, tones, UNSKEW } from './theme';

type Props = {
  career: CareerState;
  pack: ContentPack;
  /** Versión reducida para pantallas de evento */
  compact?: boolean;
  onExit?: () => void;
};

function formHint(form: number): string {
  if (form >= 70) return 'En racha — suma chance de ganar series';
  if (form < 40) return 'Fuera de ritmo — resta en partidos';
  return 'Pesa al ganar o perder en Match Day';
}

function fatigueHint(fatigue: number): string {
  if (fatigue >= 85) return 'Quemado: la forma se desploma sola';
  if (fatigue >= 70) return 'Zona roja — conviene gym o cama';
  if (fatigue >= 55) return 'Cargado — si seguís grind, pagás forma';
  return 'Bajá esto con descanso (gym rinde más)';
}

/** Lower-third de broadcast: etapa, semana, marcador y estado físico. */
export function CareerHud({ career, pack, compact, onExit }: Props) {
  const stage = pack.stages.find((s) => s.id === career.stageId);
  const nation = pack.nations.find((n) => n.id === career.profile.nationId);
  const role = pack.roles.find((r) => r.id === career.profile.roleId);
  const mastery = roleMasteryOf(career);
  const masteryTier = masteryTierLabel(mastery);
  const tone = stageTone[career.stageId] ?? 'accent';
  const t = tones[tone];
  const objective = !compact ? primaryObjective(career) : null;
  const objPct = objective ? objectiveProgress(objective, career) : 0;
  const rivalry = career.activeThreads.find((th) => th.kind === 'rivalry');
  const claimFlash =
    typeof career.flags.claimFlashUntil === 'number' &&
    career.flags.claimFlashUntil >= career.turn;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.deck,
          { borderColor: claimFlash ? tones.gold.border : t.border },
        ]}
      >
        <View style={[styles.edge, { backgroundColor: claimFlash ? tones.gold.fg : t.fg }]} />

        <View style={[styles.stageTab, { backgroundColor: t.fg }]}>
          <Text style={styles.stageTabText} numberOfLines={1}>
            {stage?.name ?? career.stageId}
          </Text>
        </View>

        {onExit ? (
          <Pressable onPress={onExit} style={styles.exit} hitSlop={10}>
            <Text style={styles.exitText}>MENÚ</Text>
          </Pressable>
        ) : null}

        <View style={styles.headRow}>
          <View style={styles.weekBlock}>
            <Text style={[styles.weekNum, { color: t.fg }]}>
              {String(Math.min(career.weekInSeason + 1, career.maxTurns)).padStart(2, '0')}
            </Text>
            <View>
              <Text style={styles.weekLabel}>SEMANA</Text>
              <Text style={styles.weekOf}>
                T{career.season} · {career.maxTurns}
              </Text>
            </View>
          </View>

          <View style={styles.identity}>
            <Text style={styles.name} numberOfLines={1}>
              {career.profile.name}
            </Text>
            <View style={styles.identityMeta}>
              <NationBadge nationId={nation?.id} tone={tone} />
              <Text style={styles.role}>
                {(role?.name ?? career.profile.roleId).toUpperCase()} · {masteryTier}
              </Text>
              <Text style={styles.age}>{career.ageYears}a</Text>
            </View>
          </View>

          <View style={styles.record}>
            <Text style={[styles.recordNum, { color: colors.gold }]}>${career.cash}</Text>
            <Text style={styles.recordLabel}>
              {career.wins}–{career.losses}
            </Text>
          </View>
        </View>

        {!compact ? (
          <View style={styles.masteryRow}>
            <Text style={styles.masteryLabel}>MAESTRÍA</Text>
            <View style={styles.masteryTrack}>
              <View
                style={[
                  styles.masteryFill,
                  { width: `${Math.max(4, mastery)}%`, backgroundColor: colors.gold },
                ]}
              />
            </View>
            <Text style={styles.masteryNum}>{mastery}</Text>
          </View>
        ) : null}

        {objective ? (
          <View style={styles.objRow}>
            <View style={styles.objTop}>
              <Text style={styles.objLabel} numberOfLines={1}>
                META · {objective.label}
              </Text>
              <Text style={styles.objNum}>
                {Math.min(objective.current(career), objective.target)}/{objective.target}
              </Text>
            </View>
            <View style={styles.objTrack}>
              <View
                style={[
                  styles.objFill,
                  {
                    width: `${Math.max(4, objPct)}%`,
                    backgroundColor: objPct >= 100 ? tones.gold.fg : t.fg,
                  },
                ]}
              />
            </View>
            <Text style={styles.objHint} numberOfLines={1}>
              {objective.hint} · {objective.rewardLabel}
            </Text>
          </View>
        ) : null}

        {rivalry && rivalry.intensity >= 30 ? (
          <Text style={styles.rivalChip} numberOfLines={1}>
            RIVALIDAD {Math.round(rivalry.intensity)} ·{' '}
            {rivalry.intensity >= 70
              ? 'cara a cara'
              : rivalry.intensity >= 40
                ? 'customs en juego'
                : 'te mide'}
          </Text>
        ) : null}

        <SeasonStrip turn={career.weekInSeason} maxTurns={career.maxTurns} tone={tone} />

        {!compact ? (
          <View style={styles.gauges}>
            <Gauge label="Forma" value={career.form} hint={formHint(career.form)} />
            <View style={styles.gaugeSplit} />
            <Gauge
              label="Fatiga"
              value={career.fatigue}
              invert
              hint={fatigueHint(career.fatigue)}
            />
          </View>
        ) : null}
      </View>

      {!compact && career.ticker.length > 0 ? (
        <Ticker items={career.ticker} tone={tone} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md, gap: 8 },
  deck: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 14,
    paddingLeft: 16,
    gap: 12,
  },
  edge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  stageTab: {
    position: 'absolute',
    top: -9,
    left: 14,
    maxWidth: '62%',
    paddingHorizontal: 10,
    paddingVertical: 3,
    transform: [{ skewX: SKEW }],
  },
  stageTabText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    transform: [{ skewX: UNSKEW }],
  },
  exit: {
    position: 'absolute',
    top: -9,
    right: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    transform: [{ skewX: SKEW }],
  },
  exitText: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    transform: [{ skewX: UNSKEW }],
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weekBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekNum: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -2,
  },
  weekLabel: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.6,
  },
  weekOf: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
  },
  identity: {
    flex: 1,
    alignItems: 'flex-end',
  },
  name: {
    color: colors.text,
    fontFamily: fonts.displaySemi,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  identityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  role: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.6,
  },
  age: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  masteryLabel: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  masteryTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  masteryFill: { height: '100%' },
  masteryNum: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    minWidth: 22,
    textAlign: 'right',
  },
  objRow: { gap: 4 },
  objTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  objLabel: {
    flex: 1,
    color: tones.gold.fg,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  objNum: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  objTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  objFill: { height: '100%' },
  objHint: {
    color: colors.faint,
    fontFamily: fonts.body,
    fontSize: 10,
  },
  rivalChip: {
    color: colors.danger,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  record: {
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderLeftColor: colors.line,
    paddingLeft: 12,
  },
  recordNum: {
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: -0.8,
  },
  recordLabel: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    letterSpacing: 1.6,
  },
  gauges: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  gaugeSplit: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.line,
  },
});
