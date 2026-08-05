import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { CareerState, ContentPack, Ending } from '../engine/types';
import { NationBadge } from './NationBadge';
import { colors, fonts, radius, shadow, SKEW, space, tones, UNSKEW, type Tone } from './theme';

type Props = {
  career: CareerState;
  pack: ContentPack;
  ending?: Ending;
};

const TIER: Record<string, { label: string; tone: Tone }> = {
  legend: { label: 'LEYENDA', tone: 'gold' },
  great: { label: 'RISING STAR', tone: 'accent' },
  ok: { label: 'REGIONAL', tone: 'blue' },
  fail: { label: 'FIN DE CICLO', tone: 'danger' },
};

/** Tarjeta lista para screenshot / share */
export function ShareCard({ career, pack, ending }: Props) {
  const nation = pack.nations.find((n) => n.id === career.profile.nationId);
  const stage = pack.stages.find((s) => s.id === career.stageId);
  const tier = TIER[ending?.tier ?? 'ok'] ?? TIER.ok!;
  const t = tones[tier.tone];

  return (
    <View style={[styles.card, shadow, { borderColor: t.border }]}>
      <LinearGradient
        colors={[t.bg, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.edge, { backgroundColor: t.fg }]} />

      <View style={styles.head}>
        <Text style={styles.brand}>PROPATH</Text>
        <View style={[styles.tierTab, { backgroundColor: t.fg }]}>
          <Text style={styles.tierTabText}>{tier.label}</Text>
        </View>
      </View>

      <Text style={styles.title}>{ending?.title ?? 'Fin de carrera'}</Text>

      <View style={[styles.rule, { backgroundColor: t.border }]} />

      <View style={styles.nameRow}>
        <NationBadge nationId={nation?.id} tone={tier.tone} />
        <Text style={styles.name}>{career.profile.name}</Text>
      </View>
      <Text style={styles.meta}>
        {nation?.name} · {career.profile.roleId.toUpperCase()} · {stage?.name}
      </Text>

      <View style={styles.statsRow}>
        <Stat label="Récord" value={`${career.wins}-${career.losses}`} tone={t.fg} />
        <Stat label="Rep" value={`${career.stats.reputation ?? 0}`} tone={t.fg} />
        <Stat label="Mec" value={`${career.stats.mechanics ?? 0}`} tone={t.fg} />
        <Stat label="Forma" value={`${career.form}`} tone={t.fg} />
      </View>

      <Text style={styles.weeks}>
        {career.turn}/{career.maxTurns} semanas · {career.durationId}
      </Text>
    </View>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statVal, { color: tone }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSunken,
    borderRadius: radius.md,
    padding: space.lg,
    paddingLeft: space.lg + 2,
    borderWidth: 1,
    marginVertical: space.md,
    overflow: 'hidden',
  },
  edge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brand: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 13,
    letterSpacing: 2.4,
  },
  tierTab: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    transform: [{ skewX: SKEW }],
  },
  tierTabText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 1.8,
    transform: [{ skewX: UNSKEW }],
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: -1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  rule: {
    height: 1,
    marginBottom: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: -0.5,
  },
  meta: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stat: { alignItems: 'center', flex: 1 },
  statVal: {
    fontFamily: fonts.display,
    fontSize: 19,
  },
  statLabel: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    marginTop: 3,
  },
  weeks: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 11.5,
    textAlign: 'center',
  },
});
