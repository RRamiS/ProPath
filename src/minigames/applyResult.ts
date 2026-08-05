import type { CareerState, Stats } from '../engine/types';
import { applyStatDelta } from '../engine/createCareer';
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

  const event = pack.events.find((e) => e.id === state.currentEventId);
  if (!event) return state;

  let next: CareerState = {
    ...state,
    stats: applyStatDelta(state.stats, REWARDS[grade]),
    history: [...state.history, event.id],
    currentEventId: null,
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

  if (next.turn % 3 === 0) {
    next = { ...next, stats: applyStatDelta(next.stats, { mentality: 2 }) };
  }

  next = maybePromote(next);

  if (!next.endingId && next.turn >= next.maxTurns) {
    next = { ...next, endingId: resolveEnding(next) };
  }

  return next;
}
