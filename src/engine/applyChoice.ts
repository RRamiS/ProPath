import { applyStatDelta, nextRng } from './createCareer';
import { maybePromote, resolveEnding } from './progression';
import { applyRelations } from './week';
import type { CareerState, ContentPack, GameEvent, Relations } from './types';

function flagsMatch(state: CareerState, require?: Record<string, boolean | string | number>): boolean {
  if (!require) return true;
  return Object.entries(require).every(([k, v]) => state.flags[k] === v);
}

function relationsMatch(state: CareerState, require?: Partial<Relations>): boolean {
  if (!require) return true;
  return Object.entries(require).every(([k, v]) => {
    if (typeof v !== 'number') return true;
    return (state.relations[k as keyof Relations] ?? 0) >= v;
  });
}

const RECENT_WINDOW = 6;

export function pickEvent(pack: ContentPack, state: CareerState): { event: GameEvent; seed: number } {
  const nation = pack.nations.find((n) => n.id === state.profile.nationId);
  const tags = new Set(nation?.tags ?? []);
  const recent = new Set(state.history.slice(-RECENT_WINDOW));

  const inStage = pack.events.filter((e) => {
    if (!e.stages.includes(state.stageId)) return false;
    if (e.excludeNationTags?.some((t) => tags.has(t))) return false;
    if (!relationsMatch(state, e.requireRelations)) return false;
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
    if (e.activityTags?.length && state.lastActivity) {
      if (e.activityTags.includes(state.lastActivity)) w *= 3.2;
      else w *= 0.45;
    }
    if (state.lastMatch) {
      if (state.lastMatch.won && e.id.includes('win')) w *= 1.4;
      if (!state.lastMatch.won && (e.id.includes('loss') || e.id.includes('tilt'))) w *= 1.6;
      if (state.lastMatch.mvp && e.id.includes('mvp')) w *= 2;
    }
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

/** Abre un evento narrativo sin incrementar turno (el turno ya avanzó en el hub). */
export function openEvent(pack: ContentPack, state: CareerState): CareerState {
  if (state.endingId) return state;
  const { event, seed } = pickEvent(pack, state);
  return {
    ...state,
    rngSeed: seed,
    currentEventId: event.id,
    phase: 'event',
  };
}

/** @deprecated Preferir openEvent — el turno ya no se incrementa aquí */
export function advanceToEvent(pack: ContentPack, state: CareerState): CareerState {
  return openEvent(pack, state);
}

/**
 * Tras elegir en un evento, volvemos al hub (no encadenamos otro evento).
 */
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
  const relations = applyRelations(state.relations, choice.effect.relations);

  let next: CareerState = {
    ...state,
    stats,
    flags,
    relations,
    history: [...state.history, event.id],
    currentEventId: null,
    stageId: choice.effect.setStage ?? state.stageId,
    endingId: choice.effect.ending ?? null,
    lastNotice: null,
    phase: 'hub',
  };

  if (next.turn % 3 === 0) {
    next = {
      ...next,
      stats: applyStatDelta(next.stats, { mentality: 2 }),
      fatigue: Math.max(0, next.fatigue - 2),
    };
  }

  if (!next.endingId) {
    next = maybePromote(next);
  }

  if (!next.endingId && next.turn >= next.maxTurns) {
    next = { ...next, endingId: resolveEnding(next) };
  }

  return next;
}

export function visibleChoices(state: CareerState, event: GameEvent) {
  return event.choices.filter((c) => flagsMatch(state, c.requireFlags));
}
