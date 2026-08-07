/**
 * Wrapper único para verbos interactivos (timing / hold / sort / tap).
 * Al terminar: haptic + banner LIMPIO/FALLASTE, después resuelve.
 */
import { useCallback, useState } from 'react';
import { TimingLane } from './TimingLane';
import { SortBoard } from './SortBoard';
import { TapWindow } from './TapWindow';
import { SkillResultBanner } from './SkillResultBanner';
import { buzzSkill } from './feedback';
import type { InteractVerb } from '../engine/interact';

export function VerbChallenge({
  verb,
  label,
  sortItems,
  onDone,
}: {
  verb: InteractVerb;
  label: string;
  sortItems?: string[];
  onDone: (ok: boolean) => void;
}) {
  const [result, setResult] = useState<boolean | null>(null);

  const finish = useCallback(
    (ok: boolean) => {
      if (result !== null) return;
      setResult(ok);
      buzzSkill(ok);
      setTimeout(() => onDone(ok), 620);
    },
    [onDone, result]
  );

  if (result !== null) {
    return <SkillResultBanner ok={result} />;
  }

  if (verb === 'sort') {
    return (
      <SortBoard
        title={label}
        items={sortItems ?? ['Prioridad A', 'Prioridad B', 'Prioridad C', 'Extra']}
        onDone={() => finish(true)}
      />
    );
  }
  if (verb === 'tap') {
    return <TapWindow label={label} onDone={finish} />;
  }
  return (
    <TimingLane
      label={label}
      durationMs={verb === 'hold' ? 2200 : 1600}
      onDone={finish}
    />
  );
}
