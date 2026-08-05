import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AGE_HARD, AGE_SOFT } from '../engine/season';
import { useGameStore } from '../store/gameStore';
import { Button, Panel, Tag } from '../ui/components';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import { colors, fonts, maxContentWidth, space } from '../ui/theme';

export function SeasonBreakScreen() {
  const career = useGameStore((s) => s.career);
  const continueNextSeason = useGameStore((s) => s.continueNextSeason);
  const retireCareer = useGameStore((s) => s.retireCareer);

  if (!career) return null;

  const soft = career.ageYears >= AGE_SOFT;
  const hard = career.ageYears >= AGE_HARD;

  return (
    <View style={styles.root}>
      <MobaBackdrop intensity="play" stageId={career.stageId} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <Tag label={`TEMPORADA ${Math.max(1, career.season - 1)}`} tone="gold" solid />
          <Text style={styles.title}>Split cerrado</Text>
          <Text style={styles.sub}>
            {career.ageYears} años · ${career.cash} · setup {career.ownedItems.length}/5
          </Text>

          <Panel tone="accent" label="Resumen" style={styles.panel}>
            <Text style={styles.line}>
              Temporada: {Number(career.flags.lastSeasonWins ?? 0)}V–
              {Number(career.flags.lastSeasonLosses ?? 0)}D
            </Text>
            <Text style={styles.line}>
              Carrera: {career.wins}V–{career.losses}D · {career.turn} semanas
            </Text>
            <Text style={styles.line}>Etapa: {career.stageId}</Text>
          </Panel>

          {soft ? (
            <Panel tone={hard ? 'danger' : 'warn'} label={hard ? 'Presión dura' : 'Presión suave'}>
              <Text style={styles.pressure}>
                {hard
                  ? 'A esta edad el circuito te empuja afuera. Podés seguir, pero cada serie cuesta más — y el org puede no renovar.'
                  : 'Los scouts miran tu fecha de nacimiento. Seguí si querés, sabiendo que el cuerpo ya no perdona.'}
              </Text>
            </Panel>
          ) : null}

          <Button label={`Seguir · Temporada ${career.season}`} onPress={continueNextSeason} />
          <Button
            label="Retirarme"
            variant="ghost"
            tone="danger"
            onPress={retireCareer}
            style={styles.retire}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  body: {
    flex: 1,
    padding: space.lg,
    maxWidth: maxContentWidth,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: -1.4,
    textTransform: 'uppercase',
  },
  sub: { color: colors.muted, fontFamily: fonts.bodySemi, fontSize: 14 },
  panel: { gap: 6 },
  line: { color: colors.text, fontFamily: fonts.body, fontSize: 14 },
  pressure: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  retire: { marginTop: 4 },
});
