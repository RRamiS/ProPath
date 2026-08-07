import { nextRng } from './rng';
import type {
  CareerState,
  Daypart,
  NpcActionId,
  NpcMood,
  NpcState,
  RelationKey,
  VenueId,
  WeatherId,
  WorldClock,
} from './types';

const AGENDAS: Record<RelationKey, string[]> = {
  coach: ['disciplina', 'lab', 'starting'],
  duo: ['estabilidad', 'rankeds', 'confianza'],
  rival: ['prestigio', 'highlights', 'scouting'],
  manager: ['plata', 'sponsors', 'imagen'],
};

const HOME_VENUES: Record<RelationKey, VenueId[]> = {
  coach: ['academy', 'arena'],
  duo: ['home', 'cafe', 'academy', 'gym'],
  rival: ['cafe', 'arena', 'gym'],
  manager: ['cafe', 'home'],
};

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

export function initialNpcStates(relations: CareerState['relations']): Record<RelationKey, NpcState> {
  const kinds: RelationKey[] = ['coach', 'duo', 'rival', 'manager'];
  const out = {} as Record<RelationKey, NpcState>;
  for (const kind of kinds) {
    out[kind] = {
      kind,
      venueId: HOME_VENUES[kind][0]!,
      mood: 'calm',
      energy: 70,
      agenda: AGENDAS[kind][0]!,
      trust: relations[kind],
      lastMetTurn: -10,
      urgency: 0,
      pendingAction: null,
    };
  }
  return out;
}

export function rollWorldClock(seed: number, daypart: Daypart, matchWeek: boolean): {
  clock: WorldClock;
  seed: number;
} {
  let s = seed;
  const r = () => {
    const n = nextRng(s);
    s = n.seed;
    return n.value;
  };
  const weathers: WeatherId[] = ['clear', 'rain', 'heat', 'fog'];
  const weather = weathers[Math.floor(r() * weathers.length)]!;
  const crowd = clamp(matchWeek ? 55 + r() * 40 : 10 + r() * 35);
  const ambience =
    daypart === 'night'
      ? weather === 'rain'
        ? 'Lluvia en la ventana. El circuit duerme mal.'
        : 'Luces bajas. Chat lento.'
      : weather === 'heat'
        ? 'Calor pegajoso. El AC del team house ruge.'
        : weather === 'fog'
          ? 'Neblina. La ciudad se siente lejos.'
          : 'Día claro. Buen momento para laburar.';
  return { clock: { weather, crowd, ambience }, seed: s };
}

function moodFrom(rel: number, fatigue: number, urgency: number): NpcMood {
  if (urgency >= 60) return 'urgent';
  if (rel >= 70 && fatigue < 50) return 'warm';
  if (rel <= 25) return 'cold';
  if (fatigue >= 70 || rel < 40) return 'tense';
  return 'calm';
}

const ACTIONS: NpcActionId[] = ['invite', 'avoid', 'claim', 'offer', 'leak'];

/**
 * Avanza rutinas NPC al cerrar un bloque/semana: sede, humor, acción autónoma.
 */
export function tickNpcWorld(state: CareerState, matchWeek: boolean): CareerState {
  let seed = state.rngSeed;
  const roll = () => {
    const n = nextRng(seed);
    seed = n.seed;
    return n.value;
  };

  const { clock, seed: seed2 } = rollWorldClock(seed, state.daypart, matchWeek);
  seed = seed2;

  const npcStates = { ...state.npcStates };
  const kinds: RelationKey[] = ['coach', 'duo', 'rival', 'manager'];

  const rivalry = state.activeThreads.find((t) => t.kind === 'rivalry');
  const rivalHeat = rivalry?.intensity ?? 0;

  for (const kind of kinds) {
    const prev = npcStates[kind];
    const venues = HOME_VENUES[kind];
    let venueId = venues[Math.floor(roll() * venues.length)]!;

    // Coach evita noche fuera de arena; manager aparece más de noche en café.
    if (kind === 'coach' && state.daypart === 'night' && venueId !== 'arena') {
      venueId = roll() < 0.55 ? 'academy' : venueId;
      if (state.daypart === 'night' && venueId === 'academy' && roll() < 0.4) {
        // se va a casa (no spawnea)
        venueId = 'home';
      }
    }
    if (kind === 'manager' && state.daypart === 'day' && venueId === 'cafe') {
      venueId = roll() < 0.5 ? 'home' : 'cafe';
    }

    // Rivalidad caliente: el rival aparece en café/arena y empuja situación.
    if (kind === 'rival' && rivalHeat >= 35) {
      venueId = matchWeek || rivalHeat >= 70 ? (roll() < 0.55 ? 'arena' : 'cafe') : 'cafe';
    }

    const trust = clamp(state.relations[kind]);
    const urgency = clamp(
      prev.urgency * 0.7 +
        (state.fatigue > 70 ? 15 : 0) +
        (state.lastMatch && !state.lastMatch.won && kind === 'coach' ? 20 : 0) +
        (state.activeThreads.some((t) => t.actors.includes(kind)) ? 25 : 0) +
        (kind === 'rival' ? rivalHeat * 0.35 : 0)
    );

    const agendaPool = AGENDAS[kind];
    const agenda = agendaPool[Math.floor(roll() * agendaPool.length)]!;

    let pendingAction: NpcActionId | null = prev.pendingAction;
    if (roll() < 0.35) {
      pendingAction = ACTIONS[Math.floor(roll() * ACTIONS.length)]!;
      if (kind === 'rival' && pendingAction === 'invite') pendingAction = 'claim';
      if (kind === 'manager' && pendingAction === 'leak') pendingAction = 'offer';
    }
    if (kind === 'rival' && rivalHeat >= 40 && roll() < 0.55) {
      pendingAction = rivalHeat >= 70 ? 'offer' : 'claim';
    }

    npcStates[kind] = {
      ...prev,
      venueId,
      mood: moodFrom(trust, state.fatigue, urgency),
      energy: clamp(prev.energy - (state.daypart === 'night' ? 8 : 4) + (roll() < 0.3 ? 12 : 0)),
      agenda,
      trust,
      urgency,
      pendingAction,
    };
  }

  return { ...state, npcStates, worldClock: clock, rngSeed: seed };
}

export function npcSpawnsFromState(state: CareerState): Array<{
  kind: RelationKey;
  fx: number;
  fy: number;
  mood: NpcMood;
  urgency: number;
  name: string;
}> {
  // Coordenadas de piso en unidades de habitación (-5..5), no porcentajes.
  const slots: Record<RelationKey, { fx: number; fy: number }> = {
    coach: { fx: 3.0, fy: 0.4 },
    duo: { fx: -2.2, fy: -1.8 },
    rival: { fx: 3.4, fy: -2.4 },
    manager: { fx: 0.2, fy: -3.4 },
  };

  const out: Array<{
    kind: RelationKey;
    fx: number;
    fy: number;
    mood: NpcMood;
    urgency: number;
    name: string;
  }> = [];

  for (const kind of Object.keys(state.npcStates) as RelationKey[]) {
    const npc = state.npcStates[kind];
    if (npc.venueId !== state.venueId) continue;
    if (kind === 'coach' && state.daypart === 'night' && state.venueId !== 'arena') continue;
    if (npc.pendingAction === 'avoid' && npc.urgency < 40) continue;

    const slot = slots[kind];
    out.push({
      kind,
      ...slot,
      mood: npc.mood,
      urgency: npc.urgency,
      name: state.roster[kind].name,
    });
  }

  return out;
}

export function contextualNpcLine(state: CareerState, kind: RelationKey): string {
  const npc = state.npcStates[kind];
  const name = state.roster[kind].name;
  const rel = state.relations[kind];
  const action = npc.pendingAction;

  if (action === 'invite') {
    return `${name}: "¿Venís? Tengo un plan de ${npc.agenda}."`;
  }
  if (action === 'claim') {
    return `${name}: "Hay que hablar. Esto no cierra así."`;
  }
  if (action === 'offer') {
    return `${name}: "Traigo una oferta. No es gratis."`;
  }
  if (action === 'leak') {
    return `${name}: "Escuché algo del circuito… te lo paso bajo mano."`;
  }
  if (action === 'avoid') {
    return `${name} te esquiva la mirada.`;
  }

  if (npc.mood === 'urgent') return `${name}: "Ahora. No después."`;
  if (npc.mood === 'warm') return `${name}: "Buen timing. Estaba pensando en vos."`;
  if (npc.mood === 'cold') return `${name}: "…"`;
  if (npc.mood === 'tense') return `${name}: "La semana viene fea. ${npc.agenda}."`;
  if (rel >= 60) return `${name}: "¿Laburamos ${npc.agenda}?"`;
  return `${name}: "Pasaba por acá."`;
}

export function markNpcMet(state: CareerState, kind: RelationKey): CareerState {
  const npcStates = {
    ...state.npcStates,
    [kind]: {
      ...state.npcStates[kind],
      lastMetTurn: state.turn,
      pendingAction: null as NpcActionId | null,
      urgency: Math.max(0, state.npcStates[kind].urgency - 20),
    },
  };
  return { ...state, npcStates };
}
