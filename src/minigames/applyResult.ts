import type { CareerState, Stats } from '../engine/types';
import { applyStatDelta } from '../engine/createCareer';
import { pushMemory, upsertThread } from '../engine/memory';
import { maybePromote, resolveEnding } from '../engine/progression';
import type { ContentPack } from '../engine/types';

export type MinigameGrade = 'perfect' | 'good' | 'ok' | 'miss';

const REWARDS: Record<MinigameGrade, Partial<Stats>> = {
  perfect: { mechanics: 10, gameSense: 6, reputation: 5, mentality: 3 },
  good: { mechanics: 6, gameSense: 4, reputation: 3 },
  ok: { mechanics: 3, gameSense: 2, mentality: -1 },
  miss: { mechanics: -2, mentality: -5, reputation: -2 },
};

export function gradeFromScore(score: number): MinigameGrade {
  if (score >= 0.9) return 'perfect';
  if (score >= 0.7) return 'good';
  if (score >= 0.45) return 'ok';
  return 'miss';
}

/** Aplica resultado de minijuego y vuelve al hub. */
export function applyMinigameResult(
  pack: ContentPack,
  state: CareerState,
  grade: MinigameGrade
): CareerState {
  if (state.endingId || !state.currentEventId) return state;

  const sit = state.currentSituation;
  const archetypeId = sit?.archetypeId ?? state.currentEventId;
  const instanceId = sit?.instanceId ?? state.currentEventId;

  let next: CareerState = {
    ...state,
    stats: applyStatDelta(state.stats, REWARDS[grade]),
    currentEventId: null,
    currentSituation: null,
    phase: 'hub',
    form: Math.max(0, Math.min(100, state.form + (grade === 'perfect' ? 4 : grade === 'miss' ? -3 : 1))),
    lastNotice:
      grade === 'perfect'
        ? 'Skill check PERFECTO. El VOD se ve limpio.'
        : grade === 'good'
          ? 'Buen execution. El coach asiente.'
          : grade === 'ok'
            ? 'Pasable. Hay que limpiar detalles.'
            : 'Te comieron el timing. Review dolorosa.',
    flags: {
      ...state.flags,
      lastMinigame: grade,
      minigamesPlayed: Number(state.flags.minigamesPlayed ?? 0) + 1,
    },
  };

  next = pushMemory(next, {
    archetypeId,
    instanceId,
    actors: sit?.actors ?? [],
    choiceId: `minigame_${grade}`,
    turn: next.turn,
    stage: next.stageId,
    outcome: `minigame:${grade}`,
    intensity: grade === 'perfect' ? 70 : grade === 'miss' ? 40 : 55,
    cause: sit?.cause,
    venueId: sit?.venueId ?? state.venueId,
  });

  if (sit?.threadKind) {
    const threadDelta =
      grade === 'perfect' ? -14 : grade === 'good' ? -7 : grade === 'ok' ? 3 : 12;
    next = upsertThread(next, sit.threadKind, sit.actors, threadDelta, {
      lastChoice: `minigame_${grade}`,
      lastOutcome: `minigame:${grade}`,
    });
  }

  if (next.turn % 3 === 0) {
    next = { ...next, stats: applyStatDelta(next.stats, { mentality: 2 }) };
  }

  next = maybePromote(next);

  if (!next.endingId && next.turn >= next.maxTurns && next.phase !== 'seasonBreak') {
    // Continuous career: don't hard-end on maxTurns here; season system owns that.
  }

  void pack;
  void resolveEnding;

  return next;
}
