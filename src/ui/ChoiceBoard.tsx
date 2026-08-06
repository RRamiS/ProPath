import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ChoiceEffect } from '../engine/types';
import { PressCard } from './components';
import { colors, fonts, space } from './theme';

export interface ChoiceBoardItem {
  id: string;
  label: string;
  hint?: string;
  verb?: string;
  effect?: ChoiceEffect;
}

export function ChoiceBoard({
  items,
  onChoose,
  renderEffects,
}: {
  items: ChoiceBoardItem[];
  onChoose: (id: string) => void;
  renderEffects?: (effect: ChoiceEffect) => ReactNode;
}) {
  return (
    <View style={styles.board}>
      {items.map((c) => (
        <PressCard key={c.id} onPress={() => onChoose(c.id)} style={styles.card}>
          <View style={styles.row}>
            {c.verb ? <Text style={styles.verb}>{c.verb}</Text> : null}
            <Text style={styles.label}>{c.label}</Text>
          </View>
          {c.hint ? <Text style={styles.hint}>{c.hint}</Text> : null}
          {c.effect && renderEffects ? (
            <View style={styles.effects}>{renderEffects(c.effect)}</View>
          ) : null}
        </PressCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { gap: 8 },
  card: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verb: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  label: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    flex: 1,
  },
  hint: { color: colors.muted, fontFamily: fonts.body, fontSize: 12 },
  effects: { marginTop: space.xs, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
});
