import { StyleSheet, Text, View } from 'react-native';
import type { CareerState, ContentPack } from '../engine/types';
import { colors, fonts, radius, space } from './theme';

type Props = {
  career: CareerState;
  pack: ContentPack;
  compact?: boolean;
};

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.miniWrap}>
      <View style={styles.miniLabelRow}>
        <Text style={styles.miniLabel}>{label}</Text>
        <Text style={[styles.miniVal, { color }]}>{value}</Text>
      </View>
      <View style={styles.miniTrack}>
        <View style={[styles.miniFill, { width: `${Math.max(4, Math.min(100, value))}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function CareerHud({ career, pack, compact }: Props) {
  const stage = pack.stages.find((s) => s.id === career.stageId);
  const nation = pack.nations.find((n) => n.id === career.profile.nationId);

  return (
    <View style={styles.wrap}>
      <View style={styles.seasonStrip}>
        <Text style={styles.stage}>{stage?.name ?? career.stageId}</Text>
        <Text style={styles.week}>
          Semana {career.turn}/{career.maxTurns}
        </Text>
        <Text style={styles.record}>
          {career.wins}W–{career.losses}L
        </Text>
      </View>

      <View style={styles.identity}>
        <Text style={styles.name}>
          {nation?.flag} {career.profile.name}
        </Text>
        <Text style={styles.role}>{career.profile.roleId.toUpperCase()}</Text>
      </View>

      {!compact ? (
        <View style={styles.bars}>
          <MiniBar label="Forma" value={career.form} color={colors.accent} />
          <MiniBar label="Fatiga" value={career.fatigue} color={colors.danger} />
        </View>
      ) : null}

      {career.ticker.length > 0 ? (
        <View style={styles.ticker}>
          <Text style={styles.tickerLabel}>SCENE</Text>
          <Text style={styles.tickerText} numberOfLines={2}>
            {career.ticker.join('  ·  ')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  seasonStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(14,20,28,0.85)',
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    marginBottom: 10,
  },
  stage: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
  },
  week: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
  record: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    marginLeft: 10,
  },
  identity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  role: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  bars: { gap: 6, marginBottom: 8 },
  miniWrap: { marginBottom: 2 },
  miniLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  miniLabel: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  miniVal: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  miniTrack: {
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 99,
  },
  ticker: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(107,163,255,0.08)',
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(107,163,255,0.2)',
    gap: 8,
  },
  tickerLabel: {
    color: colors.blue,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  tickerText: {
    flex: 1,
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
});
