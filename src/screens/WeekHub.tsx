import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { availableActivities } from '../engine/week';
import { buildRoster } from '../content/esports/roster';
import { useGameStore } from '../store/gameStore';
import { Body, Button, Title } from '../ui/components';
import { FadeSlide } from '../ui/motion';
import { CareerHud } from '../ui/CareerHud';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import { colors, fonts, radius, space } from '../ui/theme';

export function WeekHubScreen() {
  const pack = useGameStore((s) => s.pack);
  const career = useGameStore((s) => s.career);
  const pickActivity = useGameStore((s) => s.pickActivity);

  if (!career) return null;

  const activities = availableActivities(career, pack);
  const roster = buildRoster(career.profile.nationId, career.profile.roleId);
  const stageOrder = pack.stages.find((s) => s.id === career.stageId)?.order ?? 1;

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
            <CareerHud career={career} pack={pack} />

            <Text style={styles.eyebrow}>Esta semana</Text>
            <Title style={{ fontSize: 26, marginBottom: 6 }}>¿Dónde invertís?</Title>
            <Body style={{ marginBottom: 16 }}>
              Cada elección mueve forma, fatiga y relaciones. El tiempo no vuelve.
            </Body>

            {career.lastNotice ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>{career.lastNotice}</Text>
              </View>
            ) : null}

            {activities.map((a, i) => (
              <FadeSlide key={a.id} delay={i * 40}>
                <Button
                  variant="choice"
                  label={a.label}
                  hint={a.hint}
                  onPress={() => pickActivity(a.id)}
                />
              </FadeSlide>
            ))}

            <Text style={styles.relTitle}>Círculo</Text>
            <View style={styles.relGrid}>
              {(
                [
                  { key: 'coach' as const, npc: roster.coach },
                  { key: 'duo' as const, npc: roster.duo },
                  { key: 'rival' as const, npc: roster.rival },
                  ...(stageOrder >= 3
                    ? [{ key: 'manager' as const, npc: roster.manager }]
                    : []),
                ]
              ).map(({ key, npc }) => (
                <View key={key} style={styles.relCard}>
                  <Text style={styles.relName}>{npc.name}</Text>
                  <Text style={styles.relRole}>{npc.role}</Text>
                  <View style={styles.relBarTrack}>
                    <View
                      style={[styles.relBarFill, { width: `${career.relations[key]}%` }]}
                    />
                  </View>
                </View>
              ))}
            </View>
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
  },
  eyebrow: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  notice: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(61,220,151,0.28)',
  },
  noticeText: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodySemi,
  },
  relTitle: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: space.lg,
    marginBottom: 10,
  },
  relGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  relName: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  relRole: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    marginBottom: 8,
  },
  relBarTrack: {
    height: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  relBarFill: {
    height: '100%',
    backgroundColor: colors.blue,
    borderRadius: 99,
  },
});
