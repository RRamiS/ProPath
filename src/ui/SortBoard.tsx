import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, tones } from './theme';

/** Verbo gráfico: ordenar / arrastrar (tap-to-reorder simplificado). */
export function SortBoard({
  title,
  items,
  onDone,
}: {
  title: string;
  items: string[];
  onDone: (ordered: string[]) => void;
}) {
  const initial = useMemo(() => [...items].sort(() => Math.random() - 0.5), [items]);
  const [order, setOrder] = useState(initial);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...order];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    const tmp = next[index]!;
    next[index] = next[j]!;
    next[j] = tmp;
    setOrder(next);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>Reordená con ▲▼ y confirmá.</Text>
      {order.map((item, i) => (
        <View key={`${item}-${i}`} style={styles.row}>
          <Text style={styles.item}>{item}</Text>
          <View style={styles.controls}>
            <Pressable onPress={() => move(i, -1)} style={styles.ctrl}>
              <Text style={styles.ctrlText}>▲</Text>
            </Pressable>
            <Pressable onPress={() => move(i, 1)} style={styles.ctrl}>
              <Text style={styles.ctrlText}>▼</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <Pressable onPress={() => onDone(order)} style={styles.done}>
        <Text style={styles.doneText}>Confirmar orden</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, padding: 12, borderWidth: 1, borderColor: tones.gold.border, backgroundColor: colors.bgCard },
  title: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 14 },
  hint: { color: colors.muted, fontFamily: fonts.body, fontSize: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  item: { color: colors.text, fontFamily: fonts.body, fontSize: 13, flex: 1 },
  controls: { flexDirection: 'row', gap: 4 },
  ctrl: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSunken,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ctrlText: { color: colors.gold, fontSize: 12 },
  done: {
    marginTop: 4,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: tones.gold.fg,
  },
  doneText: { color: colors.onAccent, fontFamily: fonts.bodyBold, fontSize: 12 },
});
