import { StyleSheet, Text, View } from 'react-native';
import type { CareerState, ContentPack, Ending } from '../engine/types';
import { colors, fonts, radius, shadow, space } from './theme';

type Props = {
  career: CareerState;
  pack: ContentPack;
  ending?: Ending;
};

/** Tarjeta lista para screenshot / share */
export function ShareCard({ career, pack, ending }: Props) {
  const nation = pack.nations.find((n) => n.id === career.profile.nationId);
  const stage = pack.stages.find((s) => s.id === career.stageId);
  const tier =
    ending?.tier === 'legend'
      ? 'LEYENDA'
      : ending?.tier === 'great'
        ? 'RISING STAR'
        : ending?.tier === 'ok'
          ? 'REGIONAL'
          : 'CAREER END';

  return (
    <View style={[styles.card, shadow]}>
      <Text style={styles.brand}>ProPath</Text>
      <Text style={styles.tier}>{tier}</Text>
      <Text style={styles.title}>{ending?.title ?? 'Fin de carrera'}</Text>
      <View style={styles.divider} />
      <Text style={styles.name}>
        {nation?.flag}  {career.profile.name}
      </Text>
      <Text style={styles.meta}>
        {nation?.name} · {career.profile.roleId.toUpperCase()} · {stage?.name}
      </Text>
      <View style={styles.statsRow}>
        <Stat label="Record" value={`${career.wins}–${career.losses}`} />
        <Stat label="Rep" value={`${career.stats.reputation ?? 0}`} />
        <Stat label="Mec" value={`${career.stats.mechanics ?? 0}`} />
        <Stat label="Forma" value={`${career.form}`} />
      </View>
      <Text style={styles.weeks}>
        {career.turn}/{career.maxTurns} semanas · {career.durationId}
      </Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A1210',
    borderRadius: radius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: 'rgba(61,220,151,0.45)',
    marginVertical: space.md,
  },
  brand: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 8,
  },
  tier: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.displaySemi,
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lineStrong,
    marginBottom: 14,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    marginBottom: 4,
  },
  meta: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  stat: { alignItems: 'center', flex: 1 },
  statVal: {
    color: colors.accent,
    fontFamily: fonts.displaySemi,
    fontSize: 18,
  },
  statLabel: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    marginTop: 2,
  },
  weeks: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    textAlign: 'center',
  },
});
