import { StyleSheet, View } from 'react-native';
import type { ChoiceEffect, Relations, StatId } from '../engine/types';
import { Chip } from './components';
import type { Tone } from './theme';

const RELATION_LABELS: Record<keyof Relations, string> = {
  coach: 'Coach',
  duo: 'Duo',
  rival: 'Rival',
  manager: 'Manager',
};

type Entry = { label: string; tone: Tone };

function fmt(label: string, delta: number): Entry {
  const sign = delta > 0 ? '+' : '−';
  return {
    label: `${label} ${sign}${Math.abs(delta)}`,
    tone: delta > 0 ? 'accent' : 'danger',
  };
}

export function effectEntries(
  effect: ChoiceEffect,
  statLabels: Record<StatId, string>
): Entry[] {
  const out: Entry[] = [];

  for (const [id, delta] of Object.entries(effect.stats ?? {})) {
    if (typeof delta !== 'number' || delta === 0) continue;
    out.push(fmt(statLabels[id] ?? id, delta));
  }

  for (const [id, delta] of Object.entries(effect.relations ?? {})) {
    if (typeof delta !== 'number' || delta === 0) continue;
    out.push(fmt(RELATION_LABELS[id as keyof Relations] ?? id, delta));
  }

  if (effect.setStage) out.push({ label: 'Cambia de etapa', tone: 'gold' });
  if (effect.ending) out.push({ label: 'Cierra la carrera', tone: 'violet' });

  return out;
}

/** Muestra las consecuencias de una decisión: el jugador elige informado. */
export function EffectChips({
  effect,
  statLabels,
  max = 4,
}: {
  effect: ChoiceEffect;
  statLabels: Record<StatId, string>;
  max?: number;
}) {
  const entries = effectEntries(effect, statLabels);
  if (entries.length === 0) return null;

  const shown = entries.slice(0, max);
  const rest = entries.length - shown.length;

  return (
    <View style={styles.row}>
      {shown.map((e) => (
        <Chip key={e.label} label={e.label} tone={e.tone} />
      ))}
      {rest > 0 ? <Chip label={`+${rest}`} tone="muted" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
