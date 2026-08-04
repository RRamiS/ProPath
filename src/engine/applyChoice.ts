import { applyStatDelta, nextRng } from './createCareer';
import { maybePromote, resolveEnding } from './progression';
import type { CareerState, ContentPack, GameEvent } from './types';

function flagsMatch(state: CareerState, require?: Record<string, boolean | string | number>): boolean {
  if (!require) return true;
  return Object.entries(require).every(([k, v]) => state.flags[k] === v);
}

const RECENT_WINDOW = 6;

export function pickEvent(pack: ContentPack, state: CareerState): { event: GameEvent; seed: number } {
  const nation = pack.nations.find((n) => n.id === state.profile.nationId);
  const tags = new Set(nation?.tags ?? []);
  const recent = new Set(state.history.slice(-RECENT_WINDOW));

  const inStage = pack.events.filter((e) => {
    if (!e.stages.includes(state.stageId)) return false;
    if (e.excludeNationTags?.some((t) => tags.has(t))) return false;
    return true;
  });

  let pool = inStage.filter((e) => !recent.has(e.id));
  if (pool.length === 0) pool = inStage;
  if (pool.length === 0) {
    const fallback = pack.events[0];
    if (!fallback) throw new Error('No events in pack');
    return { event: fallback, seed: state.rngSeed };
  }

  let seed = state.rngSeed;
  const weighted = pool.map((e) => {
    let w = e.weight ?? 1;
    if (e.nationTags?.some((t) => tags.has(t))) w *= 2.4;
    return { e, w };
  });

  const total = weighted.reduce((s, x) => s + x.w, 0);
  const roll = nextRng(seed);
  seed = roll.seed;
  let cursor = roll.value * total;

  for (const item of weighted) {
    cursor -= item.w;
    if (cursor <= 0) return { event: item.e, seed };
  }

  return { event: weighted[weighted.length - 1]!.e, seed };
}

export function advanceToEvent(pack: ContentPack, state: CareerState): CareerState {
  if (state.endingId) return state;
  const { event, seed } = pickEvent(pack, state);
  return {
    ...state,
    rngSeed: seed,
    currentEventId: event.id,
    turn: state.turn + 1,
  };
}

export function applyChoice(
  pack: ContentPack,
  state: CareerState,
  choiceId: string
): CareerState {
  if (state.endingId || !state.currentEventId) return state;

  const event = pack.events.find((e) => e.id === state.currentEventId);
  if (!event) return state;

  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) return state;
  if (!flagsMatch(state, choice.requireFlags)) return state;

  const stats = applyStatDelta(state.stats, choice.effect.stats);
  const flags = { ...state.flags, ...(choice.effect.flags ?? {}) };

  let next: CareerState = {
    ...state,
    stats,
    flags,
    history: [...state.history, event.id],
    currentEventId: null,
    stageId: choice.effect.setStage ?? state.stageId,
    endingId: choice.effect.ending ?? null,
    lastNotice: null,
  };

  // Micro-recuperación en partidas largas (evita death spiral de mentalidad)
  if (next.turn % 3 === 0) {
    next = {
      ...next,
      stats: applyStatDelta(next.stats, { mentality: 2 }),
    };
  }

  if (!next.endingId) {
    next = maybePromote(next);
  }

  // Fin natural al completar la duración elegida
  if (!next.endingId && next.turn >= next.maxTurns) {
    next = { ...next, endingId: resolveEnding(next) };
  }

  if (next.endingId) return next;
  return advanceToEvent(pack, next);
}

export function visibleChoices(state: CareerState, event: GameEvent) {
  return event.choices.filter((c) => flagsMatch(state, c.requireFlags));
}
