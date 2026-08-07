import { applyStatDelta } from './createCareer';
import { pushMemory } from './memory';
import { maybePromote } from './progression';
import {
  applySituationChoice,
  findEvent,
  openSituation,
} from './situationDirector';
import { applyRelations } from './week';
import type { CareerState, ContentPack, GameEvent, SituationInstance } from './types';

function flagsMatch(state: CareerState, require?: Record<string, boolean | string | number>): boolean {
  if (!require) return true;
  return Object.entries(require).every(([k, v]) => state.flags[k] === v);
}

/** @deprecated use openSituation — kept as alias for store/smoke. */
export function openEvent(pack: ContentPack, state: CareerState): CareerState {
  return openSituation(pack, state);
}

/** @deprecated selection moved to situationDirector.pickSituation */
export function pickEvent(pack: ContentPack, state: CareerState): { event: GameEvent; seed: number } {
  const next = openSituation(pack, state);
  const event = situationAsEvent(next.currentSituation) ?? findEvent(pack, next.currentEventId);
  if (!event) throw new Error('No event');
  return { event, seed: next.rngSeed };
}

function situationAsEvent(sit: SituationInstance | null): GameEvent | null {
  if (!sit) return null;
  return {
    id: sit.archetypeId,
    title: sit.title,
    body: sit.body,
    stages: [sit.venueId],
    choices: sit.choices.map((c) => ({
      id: c.id,
      label: c.label,
      hint: c.hint,
      effect: c.effect,
    })),
    minigame: sit.minigame,
  };
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

  const fromSit = applySituationChoice(state, choiceId);
  const sit = state.currentSituation;

  let effect;
  let outcome = choiceId;
  let actors = sit?.actors ?? [];
  let archetypeId = state.currentEventId;
  let instanceId = sit?.instanceId ?? state.currentEventId;
  let cause = sit?.cause;
  let venueId = sit?.venueId ?? state.venueId;

  if (fromSit) {
    effect = fromSit.choice.effect;
    outcome = fromSit.choice.outcome ?? fromSit.choice.label;
    state = fromSit.state;
  } else {
    const event = findEvent(pack, state.currentEventId);
    if (!event) return state;
    const choice = event.choices.find((c) => c.id === choiceId);
    if (!choice) return state;
    if (!flagsMatch(state, choice.requireFlags)) return state;
    effect = choice.effect;
    outcome = choice.label;
  }

  if (!effect) return state;

  const stats = applyStatDelta(state.stats, effect.stats);
  const flags = {
    ...state.flags,
    ...(effect.flags ?? {}),
    lastChoice: choiceId,
    lastArchetype: archetypeId,
  };
  const relations = applyRelations(state.relations, effect.relations);

  let next: CareerState = {
    ...state,
    stats,
    flags,
    relations,
    form: Math.max(0, Math.min(100, state.form + (effect.form ?? 0))),
    fatigue: Math.max(0, Math.min(100, state.fatigue + (effect.fatigue ?? 0))),
    currentEventId: null,
    currentSituation: null,
    stageId: effect.setStage ?? state.stageId,
    endingId: effect.ending ?? null,
    lastNotice: outcome,
    phase: 'hub',
  };

  next = pushMemory(next, {
    archetypeId,
    instanceId,
    actors,
    choiceId,
    turn: next.turn,
    stage: next.stageId,
    outcome,
    intensity: 50,
    cause,
    venueId,
  });

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

  if (effect.stats?.money) {
    next = {
      ...next,
      cash: Math.max(0, next.cash + Math.round(effect.stats.money * 8)),
    };
  }

  return next;
}

export function visibleChoices(state: CareerState, event: GameEvent) {
  return event.choices.filter((c) => flagsMatch(state, c.requireFlags));
}

export function currentPlayableEvent(
  pack: ContentPack,
  state: CareerState
): GameEvent | null {
  if (state.currentSituation) return situationAsEvent(state.currentSituation);
  return findEvent(pack, state.currentEventId) ?? null;
}
