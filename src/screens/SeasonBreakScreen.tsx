import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  canSwitchRole,
  roleMasteryOf,
  roleSwitchCost,
} from '../engine/role';
import { AGE_HARD, AGE_SOFT } from '../engine/season';
import { useGameStore } from '../store/gameStore';
import { Button, Panel, PressCard, Tag } from '../ui/components';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import { colors, fonts, maxContentWidth, space } from '../ui/theme';

export function SeasonBreakScreen() {
  const pack = useGameStore((s) => s.pack);
  const career = useGameStore((s) => s.career);
  const continueNextSeason = useGameStore((s) => s.continueNextSeason);
  const retireCareer = useGameStore((s) => s.retireCareer);
  const switchRole = useGameStore((s) => s.switchRole);
  const [pickingRole, setPickingRole] = useState(false);

  if (!career) return null;

  const soft = career.ageYears >= AGE_SOFT;
  const hard = career.ageYears >= AGE_HARD;
  const gate = canSwitchRole(career);
  const cost = roleSwitchCost(career);
  const currentRole = pack.roles.find((r) => r.id === career.profile.roleId);
  const mastery = roleMasteryOf(career);

  return (
    <View style={styles.root}>
      <MobaBackdrop intensity="play" stageId={career.stageId} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.line}>
              Rol: {currentRole?.name ?? career.profile.roleId.toUpperCase()} · maestría {mastery}
            </Text>
          </Panel>

          <Panel tone="gold" label="Carril" style={styles.panel}>
            <Text style={styles.pressure}>
              Entre splits podés cambiar de rol. Ganas un arranque limpio y flex ante scouts,
              pero perdés forma, plata y confianza del staff — y tu maestría arranca baja.
            </Text>
            {!pickingRole ? (
              <Button
                label={
                  gate.ok
                    ? `Cambiar rol · $${cost}`
                    : gate.reason ?? 'Cambio no disponible'
                }
                variant="ghost"
                tone="gold"
                onPress={() => gate.ok && setPickingRole(true)}
                style={styles.roleBtn}
              />
            ) : (
              <View style={styles.roleList}>
                {pack.roles
                  .filter((r) => r.id !== career.profile.roleId)
                  .map((r) => (
                    <PressCard
                      key={r.id}
                      tone="gold"
                      onPress={() => {
                        switchRole(r.id);
                        setPickingRole(false);
                      }}
                      style={styles.rolePick}
                    >
                      <Text style={styles.rolePickName}>{r.name}</Text>
                      <Text style={styles.rolePickHint} numberOfLines={2}>
                        {r.stakes}
                      </Text>
                      <Text style={styles.rolePickCost}>
                        −${cost} · maestría previa {roleMasteryOf(career, r.id) || 0}
                      </Text>
                    </PressCard>
                  ))}
                <Button
                  label="Cancelar"
                  variant="ghost"
                  onPress={() => setPickingRole(false)}
                />
              </View>
            )}
            {career.lastNotice?.includes('Cambiás a') || career.lastNotice?.includes('Cambio a') ? (
              <Text style={styles.notice}>{career.lastNotice}</Text>
            ) : null}
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  body: {
    padding: space.lg,
    maxWidth: maxContentWidth,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingBottom: 40,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: -1.4,
    textTransform: 'uppercase',
  },
  sub: { color: colors.muted, fontFamily: fonts.bodySemi, fontSize: 14 },
  panel: { gap: 8 },
  line: { color: colors.text, fontFamily: fonts.body, fontSize: 14 },
  pressure: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  roleBtn: { marginTop: 4 },
  roleList: { gap: 8, marginTop: 4 },
  rolePick: { gap: 4 },
  rolePickName: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  rolePickHint: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  rolePickCost: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  notice: {
    color: colors.gold,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  retire: { marginTop: 4 },
});
