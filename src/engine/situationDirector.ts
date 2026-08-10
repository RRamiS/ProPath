import { nextRng } from './rng';
import { recentArchetypes, turnsSinceArchetype, upsertThread } from './memory';
import {
  RIVAL_CUSTOMS_HEAT,
  RIVAL_POST_CUSTOMS_HEAT,
  RIVAL_SHOWDOWN_HEAT,
  ensureRivalryHeat,
  hasCustomsAccepted,
  rivalArchetypeForAction,
} from './rivalry';
import { isMidSeasonDue } from './season';
import { SITUATION_ARCHETYPES } from './situations';
import type {
  CareerState,
  ContentPack,
  GameEvent,
  NarrativeThread,
  RelationKey,
  SituationArchetype,
  SituationChoice,
  SituationInstance,
  SituationVerb,
  VenueId,
} from './types';

function relationsMatch(
  state: CareerState,
  require?: Partial<CareerState['relations']>
): boolean {
  if (!require) return true;
  return Object.entries(require).every(([k, v]) => {
    if (typeof v !== 'number') return true;
    return (state.relations[k as RelationKey] ?? 0) >= v;
  });
}

function fillTemplate(
  tpl: string,
  vars: Record<string, string>
): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);
}

function legacyToArchetype(event: GameEvent): SituationArchetype {
  const actorGuess: RelationKey[] = [];
  const id = event.id.toLowerCase();
  if (id.includes('coach') || id.includes('marek') || id.includes('vod')) actorGuess.push('coach');
  if (id.includes('duo') || id.includes('nyx') || id.includes('team')) actorGuess.push('duo');
  if (id.includes('rival') || id.includes('tilt')) actorGuess.push('rival');
  if (id.includes('manager') || id.includes('content') || id.includes('sponsor') || id.includes('contract')) {
    actorGuess.push('manager');
  }
  if (actorGuess.length === 0) actorGuess.push('duo');

  return {
    id: event.id,
    family: 'legacy',
    titleTemplate: event.title,
    bodyTemplate: event.body,
    stages: event.stages,
    nationTags: event.nationTags,
    excludeNationTags: event.excludeNationTags,
    activityTags: event.activityTags,
    roleTags: event.roleTags,
    requireRelations: event.requireRelations,
    actors: actorGuess,
    causes: ['contexto del circuito'],
    weight: event.weight ?? 1,
    cooldownTurns: 8,
    actorCooldownTurns: 6,
    minigame: event.minigame,
    choices: event.choices.map((c) => ({
      id: c.id,
      label: c.label,
      hint: c.hint,
      verb: (event.minigame ? 'timing' : 'choice') as SituationVerb,
      effect: c.effect,
      outcome: c.label,
    })),
  };
}

function allArchetypes(pack: ContentPack): SituationArchetype[] {
  const storylets = SITUATION_ARCHETYPES;
  const storyletIds = new Set(storylets.map((s) => s.id));
  const legacy = pack.events
    .filter((e) => !storyletIds.has(e.id))
    .map(legacyToArchetype);
  return [...storylets, ...legacy];
}

function pickCause(arch: SituationArchetype, seed: number): { cause: string; seed: number } {
  const roll = nextRng(seed);
  const cause = arch.causes[Math.floor(roll.value * arch.causes.length)] ?? arch.causes[0]!;
  return { cause, seed: roll.seed };
}

function pickActors(
  arch: SituationArchetype,
  state: CareerState,
  seed: number
): { actors: RelationKey[]; seed: number } {
  let s = seed;
  const pool = [...arch.actors];
  // Prefer present NPCs
  const present = pool.filter((a) => state.npcStates[a]?.venueId === state.venueId);
  const base = present.length > 0 ? present : pool;
  const roll = nextRng(s);
  s = roll.seed;
  const primary = base[Math.floor(roll.value * base.length)]!;
  const actors: RelationKey[] = [primary];
  const includeOther = nextRng(s);
  s = includeOther.seed;
  if (pool.length > 1 && includeOther.value > 0.55) {
    const r2 = nextRng(s);
    s = r2.seed;
    const other = pool.find((a) => a !== primary);
    if (other) actors.push(other);
  }
  return { actors, seed: s };
}

function visualFor(family: SituationArchetype['family']): SituationInstance['visual'] {
  switch (family) {
    case 'roster':
      return { accent: 'danger', propHint: 'board' };
    case 'sponsor':
      return { accent: 'gold', propHint: 'cam' };
    case 'performance':
      return { accent: 'warn', propHint: 'bed' };
    default:
      return { accent: 'blue', propHint: 'rig' };
  }
}

function localizeChoice(
  choice: SituationChoice,
  vars: Record<string, string>,
  actors: RelationKey[]
): SituationChoice {
  const relations = { ...(choice.effect.relations ?? {}) };
  if (choice.actorRelations) {
    const primary = actors[0];
    if (primary && typeof choice.actorRelations.primary === 'number') {
      relations[primary] = (relations[primary] ?? 0) + choice.actorRelations.primary;
    }
    if (typeof choice.actorRelations.others === 'number') {
      for (const actor of actors.slice(1)) {
        relations[actor] = (relations[actor] ?? 0) + choice.actorRelations.others;
      }
    }
  }
  return {
    ...choice,
    label: fillTemplate(choice.label, vars),
    hint: choice.hint ? fillTemplate(choice.hint, vars) : choice.hint,
    outcome: choice.outcome ? fillTemplate(choice.outcome, vars) : choice.outcome,
    effect: {
      ...choice.effect,
      relations: Object.keys(relations).length > 0 ? relations : undefined,
    },
  };
}

export function instantiateSituation(
  arch: SituationArchetype,
  state: CareerState,
  seed: number
): { instance: SituationInstance; seed: number } {
  let s = seed;
  const actorsPick = pickActors(arch, state, s);
  s = actorsPick.seed;
  const causePick = pickCause(arch, s);
  s = causePick.seed;

  const primary = actorsPick.actors[0]!;
  const other = actorsPick.actors[1];
  // Una situación nunca teleporta al jugador: el director filtra por sede.
  const venue: VenueId = state.venueId;

  const venueLabel =
    venue === 'home'
      ? 'tu pieza'
      : venue === 'gym'
        ? 'el gym'
        : venue === 'cafe'
          ? 'el café'
          : venue === 'academy'
            ? 'la academia'
            : 'la arena';

  const vars: Record<string, string> = {
    actor: state.roster[primary].name,
    other: other ? state.roster[other].name : 'alguien del staff',
    venue: venueLabel,
    cause: causePick.cause,
    duo: state.roster.duo.name,
    coach: state.roster.coach.name,
    rival: state.roster.rival.name,
    manager: state.roster.manager.name,
  };

  const idRoll = nextRng(s);
  s = idRoll.seed;
  const instanceId = `${arch.id}_${state.turn}_${Math.floor(idRoll.value * 1e6)}`;

  const instance: SituationInstance = {
    instanceId,
    archetypeId: arch.id,
    family: arch.family,
    title: fillTemplate(arch.titleTemplate, vars),
    body: fillTemplate(arch.bodyTemplate, vars),
    actors: actorsPick.actors,
    cause: causePick.cause,
    venueId: venue,
    choices: arch.choices.map((c) => localizeChoice(c, vars, actorsPick.actors)),
    minigame: arch.minigame,
    threadKind: arch.threadKind,
    visual: visualFor(arch.family),
  };

  return { instance, seed: s };
}

function salience(
  arch: SituationArchetype,
  state: CareerState,
  tags: Set<string>
): number {
  let w = arch.weight ?? 1;

  if (arch.nationTags?.some((t) => tags.has(t))) w *= 2.2;
  if (arch.roleTags?.includes(state.profile.roleId)) w *= 2.6;
  if (arch.activityTags?.length && state.lastActivity) {
    if (arch.activityTags.includes(state.lastActivity)) w *= 2.4;
    else w *= 0.55;
  }

  if (arch.venues?.includes(state.venueId)) w *= 1.6;
  if (arch.actors.some((a) => state.npcStates[a]?.venueId === state.venueId)) w *= 1.5;
  if (arch.actors.some((a) => (state.npcStates[a]?.urgency ?? 0) >= 50)) w *= 1.35;

  if (arch.threadKind && state.activeThreads.some((t) => t.kind === arch.threadKind)) {
    w *= 1.8;
    const thread = state.activeThreads.find((t) => t.kind === arch.threadKind);
    if (thread?.flags.lastChoice && state.flags.lastChoice === thread.flags.lastChoice) {
      w *= 1.25;
    }
  }

  // Rivalidad escalonada: customs → showdown con progreso real.
  const rivalry = state.activeThreads.find((t) => t.kind === 'rivalry');
  const rivalIntensity = rivalry?.intensity ?? 0;
  const customsDone = hasCustomsAccepted(state);
  if (arch.id === 'rival_customs') {
    if (rivalIntensity < RIVAL_CUSTOMS_HEAT || customsDone) w *= 0.02;
    else w *= 2.2;
  }
  if (arch.id === 'rival_showdown') {
    if (rivalIntensity < RIVAL_SHOWDOWN_HEAT || !customsDone) w *= 0.02;
    else if (Number(state.flags.rivalShowdownPending ?? 0) === 1) w *= 0.05;
    else if (
      Number(state.flags.rivalShowdownWon ?? 0) === 1 ||
      Number(state.flags.rivalShowdownLost ?? 0) === 1
    )
      w *= 0.02;
    else w *= 2.8;
  }
  if (arch.id === 'rival_aftermath_win' || arch.id === 'rival_aftermath_loss') {
    w *= 0; // solo via tryOpenRivalAftermathBeat
  }
  if (arch.id === 'rival_probe' && rivalIntensity >= RIVAL_SHOWDOWN_HEAT) w *= 0.45;

  if (state.flags.lastArchetype === arch.id) w *= 0.35;

  if (arch.family === 'performance' && (state.fatigue >= 65 || state.form <= 42)) w *= 1.7;
  if (arch.family === 'sponsor' && state.lastActivity === 'content') w *= 1.5;
  if (arch.family === 'roster' && state.lastMatch && !state.lastMatch.won) w *= 1.45;

  if (state.lastMatch) {
    if (state.lastMatch.won && arch.id.includes('win')) w *= 1.3;
    if (!state.lastMatch.won && (arch.id.includes('loss') || arch.id.includes('tilt'))) w *= 1.5;
    if (state.lastMatch.mvp && arch.id.includes('mvp')) w *= 1.8;
  }

  const cd = arch.cooldownTurns ?? 8;
  const since = turnsSinceArchetype(state, arch.id);
  if (since < cd) w *= 0.05;
  else if (since < cd + 4) w *= 0.4;

  // Prefer storylets over pure legacy when weights are close
  if (arch.family !== 'legacy') w *= 1.25;

  return w;
}

export function pickSituation(
  pack: ContentPack,
  state: CareerState
): { instance: SituationInstance; seed: number } {
  const nation = pack.nations.find((n) => n.id === state.profile.nationId);
  const tags = new Set(nation?.tags ?? []);
  const recent = recentArchetypes(state, 8);

  const pool = allArchetypes(pack).filter((a) => {
    if (a.id === 'mid_season_checkin') return false; // solo por force
    if (!a.stages.includes(state.stageId)) return false;
    if (a.excludeNationTags?.some((t) => tags.has(t))) return false;
    if (a.roleTags?.length && !a.roleTags.includes(state.profile.roleId)) return false;
    if (!relationsMatch(state, a.requireRelations)) return false;
    if (a.venues?.length && !a.venues.includes(state.venueId)) return false;
    return true;
  });

  let candidates = pool.filter((a) => !recent.has(a.id));
  if (candidates.length === 0) candidates = pool;
  if (candidates.length === 0) {
    const fallback = SITUATION_ARCHETYPES[0]!;
    return instantiateSituation(fallback, state, state.rngSeed);
  }

  let seed = state.rngSeed;
  const weighted = candidates.map((a) => ({ a, w: Math.max(0.01, salience(a, state, tags)) }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  const roll = nextRng(seed);
  seed = roll.seed;
  let cursor = roll.value * total;

  let chosen = weighted[weighted.length - 1]!.a;
  for (const item of weighted) {
    cursor -= item.w;
    if (cursor <= 0) {
      chosen = item.a;
      break;
    }
  }

  return instantiateSituation(chosen, state, seed);
}

/** Abre una situación materializada (reemplaza openEvent basado solo en IDs). */
export function openSituation(pack: ContentPack, state: CareerState): CareerState {
  if (state.endingId) return state;
  const { instance, seed } = pickSituation(pack, state);
  return {
    ...state,
    rngSeed: seed,
    currentEventId: instance.archetypeId,
    currentSituation: instance,
    phase: 'event',
  };
}

/** Fuerza un arquetipo concreto (beats de arco: mid-season, etc.). */
export function openForcedArchetype(
  state: CareerState,
  archetypeId: string
): CareerState {
  if (state.endingId) return state;
  const arch = SITUATION_ARCHETYPES.find((a) => a.id === archetypeId);
  if (!arch) return { ...state, phase: 'event' };
  // Ignora filtro de sede: el beat de arco te encuentra donde estés.
  const flexible = { ...arch, venues: undefined };
  const { instance, seed } = instantiateSituation(flexible, state, state.rngSeed);
  return {
    ...state,
    rngSeed: seed,
    currentEventId: instance.archetypeId,
    currentSituation: instance,
    phase: 'event',
    lastNotice: state.lastNotice,
    ticker: [`ARCO · ${instance.title}`, ...state.ticker],
  };
}

/**
 * Mitad de split: abre el check-in del staff si corresponde.
 * Devuelve null si no hay beat pendiente.
 */
export function tryOpenMidSeasonBeat(state: CareerState): CareerState | null {
  if (state.endingId) return null;
  const key = `midSeason_${state.season}`;
  const due =
    (isMidSeasonDue(state) || !!state.flags.pendingMidSeason) && !state.flags[key];
  if (!due) return null;
  const marked: CareerState = {
    ...state,
    flags: {
      ...state.flags,
      [key]: 1,
      pendingMidSeason: 0,
    },
    lastNotice: 'Mitad de split. El staff quiere hablar.',
    ticker: ['MITAD DE SPLIT', ...state.ticker],
  };
  return openForcedArchetype(marked, 'mid_season_checkin');
}

/**
 * Cierre narrativo post-showdown (W/L). Prioridad alta tras la serie personal.
 */
export function tryOpenRivalAftermathBeat(state: CareerState): CareerState | null {
  if (state.endingId) return null;
  if (!state.flags.pendingRivalAftermath) return null;
  const won = Number(state.flags.rivalShowdownWon ?? 0) === 1;
  const archetypeId = won ? 'rival_aftermath_win' : 'rival_aftermath_loss';
  const marked: CareerState = {
    ...state,
    flags: {
      ...state.flags,
      pendingRivalAftermath: 0,
    },
    lastNotice: won
      ? 'Showdown cerrado. El rival quiere la última palabra.'
      : 'Caíste en el showdown. La cuenta quedó abierta.',
    ticker: [
      won ? 'AFTERMATH · respeto a regañadientes' : 'AFTERMATH · deuda pendiente',
      ...state.ticker,
    ].slice(0, 8),
  };
  return openForcedArchetype(marked, archetypeId);
}

const NPC_ACTION_ARCHETYPE: Record<
  Exclude<CareerState['npcStates'][RelationKey]['pendingAction'], null>,
  Partial<Record<RelationKey, string>>
> = {
  invite: { coach: 'performance_dip', duo: 'duo_trust_test', manager: 'sponsor_offer' },
  avoid: {},
  claim: { coach: 'roster_rift', duo: 'roster_rift', rival: 'rival_probe', manager: 'contract_renewal' },
  offer: { coach: 'sub_pressure', duo: 'duo_trust_test', rival: 'rival_probe', manager: 'sponsor_offer' },
  leak: { coach: 'sub_pressure', duo: 'duo_trust_test', rival: 'rival_probe', manager: 'contract_renewal' },
};

/** Convierte una iniciativa autónoma de NPC en gameplay, sin elegirla por ruleta. */
export function openNpcActionSituation(
  pack: ContentPack,
  state: CareerState,
  kind: RelationKey
): CareerState | null {
  const action = state.npcStates[kind].pendingAction;
  if (!action || action === 'avoid') return null;
  const archetypeId =
    kind === 'rival'
      ? rivalArchetypeForAction(state, action)
      : NPC_ACTION_ARCHETYPE[action][kind];
  if (!archetypeId) return null;
  const findArch = (id: string) =>
    SITUATION_ARCHETYPES.find(
      (candidate) =>
        candidate.id === id &&
        candidate.stages.includes(state.stageId) &&
        (!candidate.venues?.length || candidate.venues.includes(state.venueId))
    );
  let arch = findArch(archetypeId);
  // Si la sede/etapa no matchea el arquetipo pedido, baja en la escalera.
  if (!arch && kind === 'rival') {
    for (const id of ['rival_showdown', 'rival_customs', 'rival_probe'] as const) {
      if (id === archetypeId) continue;
      arch = findArch(id);
      if (arch) break;
    }
  }
  if (!arch) return null;

  const materialized = instantiateSituation(
    { ...arch, actors: [kind, ...arch.actors.filter((actor) => actor !== kind)] },
    state,
    state.rngSeed
  );
  const npcStates = {
    ...state.npcStates,
    [kind]: {
      ...state.npcStates[kind],
      pendingAction: null,
      lastMetTurn: state.turn,
      urgency: Math.max(0, state.npcStates[kind].urgency - 25),
    },
  };
  void pack;
  return {
    ...state,
    npcStates,
    rngSeed: materialized.seed,
    currentEventId: materialized.instance.archetypeId,
    currentSituation: materialized.instance,
    phase: 'event',
  };
}

export function applySituationChoice(
  state: CareerState,
  choiceId: string
): { state: CareerState; choice: SituationChoice } | null {
  const sit = state.currentSituation;
  if (!sit) return null;
  const choice = sit.choices.find((c) => c.id === choiceId);
  if (!choice) return null;

  let next = state;
  if (sit.threadKind) {
    let delta =
      choiceId.includes('walk') || choiceId.includes('ignore') || choiceId.includes('deflect')
        ? 12
        : choiceId.includes('mediate') || choiceId.includes('apologize')
          ? -15
          : 5;
    const threadFlags: NarrativeThread['flags'] = { lastChoice: choiceId };

    if (sit.threadKind === 'rivalry') {
      if (choiceId === 'accept_customs' || choiceId === 'challenge') {
        delta = 22;
        threadFlags.customsAccepted = 1;
        next = {
          ...next,
          flags: { ...next.flags, customsAccepted: 1 },
          ticker: ['CUSTOMS · pactados con el rival', ...next.ticker].slice(0, 8),
        };
      } else if (choiceId === 'public_refuse') {
        threadFlags.customsRefused = 1;
      } else if (
        sit.archetypeId === 'rival_showdown' &&
        (choiceId === 'stare_down' || choiceId === 'clap_back')
      ) {
        delta = 12;
        next = {
          ...next,
          flags: { ...next.flags, rivalShowdownPending: 1 },
          ticker: [
            `SHOWDOWN · próxima serie vs ${next.roster.rival.name}`,
            ...next.ticker,
          ].slice(0, 8),
        };
      } else if (
        sit.archetypeId === 'rival_aftermath_win' ||
        sit.archetypeId === 'rival_aftermath_loss'
      ) {
        delta = choiceId === 'cold_silence' || choiceId === 'keep_fire' ? 8 : -10;
        threadFlags.aftermathDone = 1;
      }
    }

    next = upsertThread(next, sit.threadKind, sit.actors, delta, threadFlags);
    if (
      sit.threadKind === 'rivalry' &&
      (choiceId === 'accept_customs' || choiceId === 'challenge')
    ) {
      next = ensureRivalryHeat(next, RIVAL_POST_CUSTOMS_HEAT);
    }
  }

  return { state: next, choice };
}

/** Resuelve un GameEvent legacy cuando no hay currentSituation (compat). */
export function findEvent(pack: ContentPack, id: string | null): GameEvent | undefined {
  if (!id) return undefined;
  const matches = pack.events.filter((e) => e.id === id);
  return matches[0];
}
