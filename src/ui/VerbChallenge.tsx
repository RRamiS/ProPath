/**
 * Wrapper único para verbos interactivos (timing / react / sort / tap).
 * Prep breve → skill → haptic + banner → resuelve.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SortBoard } from './SortBoard';
import { TapWindow } from './TapWindow';
import { QuickReact } from './QuickReact';
import { SkillResultBanner } from './SkillResultBanner';
import { buzzSkill } from './feedback';
import type { InteractVerb } from '../engine/interact';
import { resolveVerb } from '../engine/interact';
import { colors, fonts, tones } from './theme';

const PREP_MS = 1100;

function PrepBanner({ label }: { label: string }) {
  return (
    <View style={styles.prep}>
      <Text style={styles.prepEyebrow}>SKILL CHECK</Text>
      <Text style={styles.prepLabel}>{label}</Text>
      <Text style={styles.prepHint}>Preparáte… arranca en un segundo</Text>
    </View>
  );
}

export function VerbChallenge({
  verb,
  label,
  sortItems,
  onDone,
  prepMs = PREP_MS,
}: {
  verb: InteractVerb;
  label: string;
  sortItems?: string[];
  onDone: (ok: boolean) => void;
  /** Delay antes de armar el minijuego (ms). */
  prepMs?: number;
}) {
  const [result, setResult] = useState<boolean | null>(null);
  const [armed, setArmed] = useState(prepMs <= 0);
  const finished = useRef(false);
  const resolved = resolveVerb(verb) ?? 'timing';

  useEffect(() => {
    if (prepMs <= 0) return;
    const t = setTimeout(() => setArmed(true), prepMs);
    return () => clearTimeout(t);
  }, [prepMs]);

  const finish = useCallback(
    (ok: boolean) => {
      if (finished.current) return;
      finished.current = true;
      setResult(ok);
      buzzSkill(ok);
      setTimeout(() => onDone(ok), 620);
    },
    [onDone]
  );

  if (result !== null) {
    return <SkillResultBanner ok={result} />;
  }

  if (!armed) {
    return <PrepBanner label={label} />;
  }

  if (resolved === 'sort') {
    return (
      <SortBoard
        title={label}
        items={sortItems ?? ['Prioridad A', 'Prioridad B', 'Prioridad C', 'Extra']}
        onDone={() => finish(true)}
      />
    );
  }
  if (resolved === 'react') {
    return <QuickReact label={label} onDone={finish} />;
  }
  if (resolved === 'tap') {
    return <TapWindow label={label} onDone={finish} durationMs={2400} zoneHalf={0.14} />;
  }
  // timing: más lento y zona un poco más generosa
  return <TapWindow label={label} onDone={finish} durationMs={3200} zoneHalf={0.17} />;
}

const styles = StyleSheet.create({
  prep: {
    gap: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: tones.warn.border,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
  },
  prepEyebrow: {
    color: tones.warn.fg,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  prepLabel: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    textAlign: 'center',
  },
  prepHint: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
});
