/**
 * Lower third de la escena: qué hace el objeto que tocaste y qué te cuesta.
 * Si hay variantes, pedís elegir entre 3 con pros/contras (no un solo "Hacerlo").
 */
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { activityChoicesFor } from '../engine/activityChoices';
import { verbLabel } from '../engine/interact';
import { relationBonuses } from '../engine/relations';
import type { CareerState, ContentPack } from '../engine/types';
import { activityImpact } from '../engine/week';
import { Button, Chip, PressCard } from '../ui/components';
import { colors, fonts, SKEW, tones, UNSKEW } from '../ui/theme';
import type { RoomSlot } from './RoomScene';

function perkNote(slot: RoomSlot, career: CareerState): string | null {
  const p = relationBonuses(career);
  if (slot.activity.id === 'vod' && p.vodBoost) return 'Perk del coach: visión de juego extra';
  if (slot.activity.id === 'scrim' && p.scrimBoost) return 'Perk del dúo: teamplay extra';
  if (slot.activity.id === 'content' && p.moneyMult > 1) {
    return `Perk del manager: ×${p.moneyMult} de plata`;
  }
  if (slot.activity.id === 'match' && (p.draftEdge || p.fightEdge)) {
    return 'Perks activos: ventaja en draft y peleas';
  }
  return null;
}

export function ActionSheet({
  slot,
  career,
  pack,
  onConfirm,
  onCancel,
}: {
  slot: RoomSlot;
  career: CareerState;
  pack: ContentPack;
  onConfirm: (variantId?: string) => void;
  onCancel: () => void;
}) {
  const impact = activityImpact(slot.activity, career.daypart);
  const t = tones[slot.tone];
  const perk = perkNote(slot, career);
  const variants = activityChoicesFor(slot.activity.id, career.venueId);

  const statChips = Object.entries(impact.stats)
    .filter(([, v]) => typeof v === 'number' && v !== 0)
    .sort((a, b) => Math.abs(b[1] as number) - Math.abs(a[1] as number))
    .map(([id, v]) => ({
      key: id,
      label: `${pack.statLabels[id] ?? id} ${(v as number) > 0 ? '+' : '−'}${Math.abs(v as number)}`,
      tone: (v as number) > 0 ? ('accent' as const) : ('danger' as const),
    }));

  const relChips = Object.entries(impact.relations)
    .filter(([, v]) => typeof v === 'number' && v !== 0)
    .map(([id, v]) => ({
      key: id,
      label: `${id === 'duo' ? 'Dúo' : id === 'coach' ? 'Coach' : id === 'rival' ? 'Rival' : 'Manager'} ${
        (v as number) > 0 ? '+' : '−'
      }${Math.abs(v as number)}`,
      tone: (v as number) > 0 ? ('blue' as const) : ('warn' as const),
    }));

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      style={[styles.sheet, { borderColor: t.border }]}
    >
      <View style={[styles.edge, { backgroundColor: t.fg }]} />

      <View style={styles.head}>
        <View style={[styles.tab, { backgroundColor: t.fg }]}>
          <Text style={styles.tabText}>{slot.activity.label.toUpperCase()}</Text>
        </View>
        <Text style={[styles.cost, { color: impact.closesWeek ? colors.danger : colors.faint }]}>
          {impact.closesWeek ? 'CIERRA LA SEMANA' : 'BLOQUE DE DÍA'}
        </Text>
      </View>

      <Text style={styles.blurb}>{slot.activity.blurb}</Text>

      <View style={styles.chips}>
        {statChips.map((c) => (
          <Chip key={c.key} label={c.label} tone={c.tone} />
        ))}
        {impact.form !== 0 ? (
          <Chip
            label={`Forma ${impact.form > 0 ? '+' : '−'}${Math.abs(impact.form)}`}
            tone={impact.form > 0 ? 'accent' : 'danger'}
          />
        ) : null}
        {impact.fatigue !== 0 ? (
          <Chip
            label={`Fatiga ${impact.fatigue > 0 ? '+' : '−'}${Math.abs(impact.fatigue)}`}
            tone={impact.fatigue > 0 ? 'danger' : 'accent'}
          />
        ) : null}
        {relChips.map((c) => (
          <Chip key={c.key} label={c.label} tone={c.tone} />
        ))}
      </View>

      {perk ? (
        <View style={styles.perkRow}>
          <View style={[styles.perkDot, { backgroundColor: t.fg }]} />
          <Text style={styles.perkText}>{perk}</Text>
        </View>
      ) : null}

      {variants ? (
        <View style={styles.variants}>
          <Text style={styles.variantsLabel}>¿CÓMO LO HACÉS?</Text>
          {variants.map((v) => (
            <PressCard
              key={v.id}
              onPress={() => onConfirm(v.id)}
              tone={slot.tone}
              style={styles.variantCard}
            >
              <View style={styles.variantHead}>
                {verbLabel(v.verb) ? (
                  <Text style={styles.variantVerb}>{verbLabel(v.verb)}</Text>
                ) : null}
                <Text style={styles.variantLabel}>{v.label}</Text>
              </View>
              <Text style={styles.variantHint}>{v.hint}</Text>
            </PressCard>
          ))}
          <Button label="Volver" variant="ghost" onPress={onCancel} style={styles.ghostBtn} />
        </View>
      ) : (
        <View style={styles.actions}>
          <Button label="Volver" variant="ghost" onPress={onCancel} style={styles.ghostBtn} />
          <Button
            label={slot.activity.id === 'match' ? 'Salir a la cancha' : 'Hacerlo'}
            tone={slot.tone}
            onPress={() => onConfirm()}
            style={styles.mainBtn}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderTopWidth: 0,
    padding: 14,
    paddingLeft: 16,
    gap: 10,
    overflow: 'hidden',
  },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 2 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  tab: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    transform: [{ skewX: SKEW }],
  },
  tabText: {
    color: colors.onAccent,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.3,
    transform: [{ skewX: UNSKEW }],
  },
  cost: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  blurb: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  perkDot: { width: 5, height: 5, borderRadius: 3 },
  perkText: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
  },
  variants: { gap: 6, marginTop: 2 },
  variantsLabel: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  variantCard: { gap: 2, paddingVertical: 10 },
  variantHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  variantVerb: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  variantLabel: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    flex: 1,
  },
  variantHint: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  ghostBtn: { flexGrow: 0, flexBasis: 96 },
  mainBtn: { flex: 1 },
});
