import { applyStatDelta, nextRng } from './createCareer';
import { setupBonuses } from './economy';
import { claimObjectives } from './objectives';
import { maybePromote } from './progression';
import { relationBonuses } from './relations';
import {
  agePressure,
  applyWeeklyCosts,
  closeSeason,
  maybeForceRetire,
} from './season';
import { venueAllows } from './venues';
import type {
  CareerState,
  ContentPack,
  Daypart,
  Relations,
  Stats,
  WeekActivityId,
} from './types';

export interface WeekActivity {
  id: WeekActivityId;
  label: string;
  blurb: string;
  stats: Partial<Stats>;
  /** Delta de forma competitiva */
  form: number;
  /** Delta de fatiga */
  fatigue: number;
  relations: Partial<Relations>;
  notice: string;
  /** Solo visible desde cierta etapa */
  minStageOrder?: number;
  /** En qué bloques del día se puede hacer */
  slots: Daypart[];
  /** Consume la semana entera en vez de un bloque */
  fullWeek?: boolean;
  /** Objeto de la habitación que dispara la actividad */
  prop: string;
}

/** Un bloque rinde menos que una semana entera: son dos por semana. */
const SLOT_SCALE = 0.7;

/**
 * Tabla única de actividades: el motor la aplica y la UI la lee para mostrar
 * los efectos, así no pueden desincronizarse.
 */
export const WEEK_ACTIVITIES: WeekActivity[] = [
  {
    id: 'soloq',
    label: 'Grind SoloQ',
    blurb: 'Horas de ranked en silencio. Sube las manos, castiga la cabeza.',
    stats: { mechanics: 4, gameSense: 2, mentality: -2 },
    form: 3,
    fatigue: 9,
    relations: { rival: 2 },
    notice: 'SoloQ: manos calientes, cabeza cargada.',
    slots: ['day', 'night'],
    prop: 'rig',
  },
  {
    id: 'scrim',
    label: 'Scrims de team',
    blurb: 'Bloques con el roster. Construye teamplay y confianza.',
    stats: { teamwork: 5, gameSense: 2, mechanics: 2 },
    form: 2,
    fatigue: 11,
    relations: { coach: 3, duo: 4 },
    notice: 'Scrims densos. El roster respira junto.',
    minStageOrder: 2,
    slots: ['day'],
    prop: 'board',
  },
  {
    id: 'vod',
    label: 'VOD / lab',
    blurb: 'Frame por frame con el coach. Menos ego, más lectura.',
    stats: { gameSense: 6, mentality: 2 },
    form: 0,
    fatigue: -4,
    relations: { coach: 3 },
    notice: 'Lab de VOD: menos ego, más pattern recognition.',
    slots: ['day', 'night'],
    prop: 'tv',
  },
  {
    id: 'rest',
    label: 'Descansar',
    blurb: 'Dormir, entrenar, desconectar. La forma baja, la mente vuelve.',
    stats: { mentality: 7, mechanics: -1 },
    form: 2,
    fatigue: -22,
    relations: {},
    notice: 'Recovery. El body clock agradece.',
    slots: ['day', 'night'],
    prop: 'bed',
  },
  {
    id: 'content',
    label: 'Contenido / marca',
    blurb: 'Clips, stream y sponsors. Suma plata; el team mira el reloj.',
    stats: { reputation: 6, money: 5, teamwork: -3 },
    form: 0,
    fatigue: 5,
    relations: { manager: 4, duo: -1 },
    notice: 'Contenido out. La marca suma; el team mira el reloj.',
    slots: ['night'],
    prop: 'cam',
  },
  {
    id: 'match',
    label: 'Día de partido',
    blurb: 'Serie oficial con público. Cuatro fases, todo en vivo.',
    stats: {},
    form: 1,
    fatigue: 6,
    relations: {},
    notice: 'Día de partido. Draft room en 3…',
    minStageOrder: 2,
    slots: ['day'],
    fullWeek: true,
    prop: 'door',
  },
];

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function getActivity(id: WeekActivityId): WeekActivity {
  return WEEK_ACTIVITIES.find((a) => a.id === id) ?? WEEK_ACTIVITIES[0]!;
}

export function availableActivities(state: CareerState, pack: ContentPack): WeekActivity[] {
  const order = pack.stages.find((s) => s.id === state.stageId)?.order ?? 1;
  return WEEK_ACTIVITIES.filter(
    (a) =>
      (a.minStageOrder ?? 0) <= order &&
      a.slots.includes(state.daypart) &&
      venueAllows(state.venueId, a.id)
  );
}

/**
 * Fixture: hay calendario, no ruleta. Desde Challengers se juega semana de por
 * medio y en la élite todas las semanas. Saber cuándo te toca es media carrera.
 */
export function isMatchWeek(state: CareerState, pack: ContentPack): boolean {
  const order = pack.stages.find((s) => s.id === state.stageId)?.order ?? 1;
  if (order < 2) return false;
  if (order >= 4) return true;
  if (order >= 3) return state.turn % 2 === 1;
  // Challengers: una serie cada tres semanas — hay tiempo de construir.
  return state.turn % 3 === 2;
}

/** Cuántas semanas faltan para la próxima serie (0 = esta semana). */
export function weeksToMatch(state: CareerState, pack: ContentPack): number | null {
  const order = pack.stages.find((s) => s.id === state.stageId)?.order ?? 1;
  if (order < 2) return null;
  if (isMatchWeek(state, pack)) return 0;
  if (order >= 4) return 0;
  if (order >= 3) return state.turn % 2 === 0 ? 1 : 0;
  const rem = state.turn % 3;
  return rem === 2 ? 0 : 2 - rem;
}

/** Efectos de la actividad ya escalados al bloque: lo que la UI debe mostrar. */
export function activityImpact(activity: WeekActivity, daypart: Daypart) {
  const scale = activity.fullWeek ? 1 : SLOT_SCALE;
  const stats: Partial<Stats> = {};
  for (const [k, v] of Object.entries(activity.stats)) {
    if (typeof v === 'number') stats[k] = Math.round(v * scale);
  }
  const relations: Partial<Relations> = {};
  for (const [k, v] of Object.entries(activity.relations)) {
    if (typeof v === 'number') {
      relations[k as keyof Relations] = Math.round(v * scale);
    }
  }
  return {
    stats,
    relations,
    form: Math.round(activity.form * scale),
    fatigue: Math.round(activity.fatigue * scale),
    closesWeek: activity.fullWeek === true || daypart === 'night',
  };
}

function applyRelations(rel: Relations, delta?: Partial<Relations>): Relations {
  const out = { ...rel };
  if (!delta) return out;
  for (const [k, v] of Object.entries(delta)) {
    if (typeof v === 'number') {
      out[k as keyof Relations] = clamp((out[k as keyof Relations] ?? 0) + v);
    }
  }
  return out;
}

function tickerFor(activity: WeekActivityId, state: CareerState): string[] {
  const name = state.profile.name;
  const base = [
    `Patch notes: ajustes al meta de ${state.profile.roleId}`,
    `Scouts miran el server de ${state.flags.region ?? 'tu región'}`,
  ];
  switch (activity) {
    case 'soloq':
      return [`${name} farmea LP en silencio`, ...base];
    case 'scrim':
      return ['Bloque de scrims · coach Marek en voice', ...base];
    case 'vod':
      return ['Sala de VOD · frame por frame', ...base];
    case 'rest':
      return ['Día off · recovery protocol', ...base];
    case 'content':
      return ['Clip subiendo · comunidad activa', ...base];
    case 'match':
      return ['MATCH DAY · luces en la arena', `${name} en el draft room`];
    default:
      return base;
  }
}

export type WeekOutcome =
  /** Se gastó el bloque de día; la semana sigue abierta. */
  | { kind: 'slot'; state: CareerState }
  | { kind: 'match'; state: CareerState }
  | { kind: 'event'; state: CareerState }
  | { kind: 'season'; state: CareerState }
  | { kind: 'ending'; state: CareerState };

/**
 * El jugador gasta un bloque de la semana (día o noche).
 * El bloque de noche cierra la semana y puede derivar en partido, evento o fin de temporada.
 */
export function applyWeekActivity(
  pack: ContentPack,
  state: CareerState,
  activityId: WeekActivityId
): WeekOutcome {
  if (state.endingId) return { kind: 'ending', state };
  if (state.phase === 'seasonBreak') return { kind: 'season', state };

  let seed = state.rngSeed;
  const roll = () => {
    const r = nextRng(seed);
    seed = r.seed;
    return r.value;
  };

  const activity = getActivity(activityId);
  const impact = activityImpact(activity, state.daypart);
  const perks = relationBonuses(state);
  const setup = setupBonuses(state);
  const age = agePressure(state.ageYears);

  const boosted = { ...impact.stats };
  if (activityId === 'vod' && perks.vodBoost) {
    boosted.gameSense = (boosted.gameSense ?? 0) + perks.vodBoost;
  }
  if (activityId === 'scrim' && perks.scrimBoost) {
    boosted.teamwork = (boosted.teamwork ?? 0) + perks.scrimBoost;
  }
  if (activityId === 'soloq' && setup.soloqMechanics) {
    boosted.mechanics = (boosted.mechanics ?? 0) + setup.soloqMechanics;
  }

  // Contenido paga cash real, no solo el stat.
  let cashGain = 0;
  if (activityId === 'content') {
    const base = Math.round((boosted.money ?? 5) * 8 * perks.moneyMult);
    cashGain = base;
    delete boosted.money;
  }

  let stats = applyStatDelta({ ...state.stats }, boosted);
  let form = clamp(state.form + impact.form);
  let fatigueDelta = impact.fatigue;
  if (activityId === 'rest') {
    fatigueDelta = Math.round(fatigueDelta * age.restNerf) + setup.restFatigue;
  }
  let fatigue = clamp(state.fatigue + fatigueDelta);
  const relations = applyRelations(state.relations, impact.relations);

  if (!impact.closesWeek) {
    return {
      kind: 'slot',
      state: {
        ...state,
        stats,
        form,
        fatigue,
        relations,
        cash: state.cash + cashGain,
        daypart: 'night',
        lastActivity: activityId,
        rngSeed: seed,
        lastNotice: cashGain
          ? `${activity.notice} +$${cashGain}`
          : activity.notice,
        ticker: tickerFor(activityId, state),
        phase: 'hub',
        currentEventId: null,
      },
    };
  }

  form = clamp(form - 1 - age.formDecay);
  fatigue = clamp(fatigue - 2 - perks.loadManagement);

  if (fatigue >= 70) {
    form = clamp(form - 3);
    stats = applyStatDelta(stats, { mentality: -2, mechanics: -1 });
  }
  if (fatigue >= 85) {
    form = clamp(form - 5);
    stats = applyStatDelta(stats, { mentality: -4, gameSense: -2 });
  }

  const turn = state.turn + 1;
  const weekInSeason = state.weekInSeason + 1;

  let next: CareerState = {
    ...state,
    stats,
    form,
    fatigue,
    relations,
    cash: state.cash + cashGain,
    lastActivity: activityId,
    turn,
    weekInSeason,
    daypart: 'day',
    rngSeed: seed,
    lastNotice: cashGain ? `${activity.notice} +$${cashGain}` : activity.notice,
    ticker: tickerFor(activityId, state),
    phase: 'hub',
    currentEventId: null,
  };

  next = applyWeeklyCosts(next);
  next = maybePromote(next);

  const claim = claimObjectives(next);
  if (claim.claimed.length > 0) {
    const rewardCash = Math.round((claim.claimed[0]!.reward.money ?? 0) * 10);
    next = {
      ...claim.state,
      cash: claim.state.cash + rewardCash,
      lastNotice: `Objetivo cumplido: ${claim.claimed[0]!.label} — ${claim.claimed[0]!.rewardLabel}`,
      ticker: [`OBJETIVO · ${claim.claimed[0]!.label}`, ...next.ticker],
    };
  }

  const stageOrder = pack.stages.find((s) => s.id === next.stageId)?.order ?? 1;
  let goMatch = activityId === 'match' || isMatchWeek(state, pack);
  if (!goMatch && stageOrder >= 2 && activityId === 'scrim') {
    goMatch = roll() < 0.2;
  }

  // La serie se juega aunque sea la última semana; el break viene después.
  if (goMatch) {
    return {
      kind: 'match',
      state: { ...next, phase: 'match', lastActivity: 'match', venueId: 'arena' },
    };
  }

  if (weekInSeason >= next.maxTurns) {
    const closed = closeSeason(next);
    const forced = maybeForceRetire(closed, roll());
    if (forced) return { kind: 'ending', state: forced };
    return { kind: 'season', state: closed };
  }

  return { kind: 'event', state: { ...next, phase: 'event' } };
}

export { applyRelations };
