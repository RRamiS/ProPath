import { applyStatDelta, nextRng } from './createCareer';
import { claimObjectives } from './objectives';
import { maybePromote, resolveEnding } from './progression';
import type {
  CareerState,
  ContentPack,
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
}

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
    notice: 'Semana de SoloQ: manos calientes, cabeza cargada.',
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
  },
  {
    id: 'rest',
    label: 'Descansar',
    blurb: 'Dormir, entrenar, desconectar. La forma baja, la mente vuelve.',
    stats: { mentality: 7, mechanics: -1 },
    form: -2,
    fatigue: -22,
    relations: {},
    notice: 'Recovery. El body clock agradece.',
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
  return WEEK_ACTIVITIES.filter((a) => (a.minStageOrder ?? 0) <= order);
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
  | { kind: 'match'; state: CareerState }
  | { kind: 'event'; state: CareerState }
  | { kind: 'ending'; state: CareerState };

/**
 * El jugador elige cómo gastar la semana.
 * Puede derivar en partido live o en evento narrativo.
 */
export function applyWeekActivity(
  pack: ContentPack,
  state: CareerState,
  activityId: WeekActivityId
): WeekOutcome {
  if (state.endingId) return { kind: 'ending', state };

  let seed = state.rngSeed;
  const roll = () => {
    const r = nextRng(seed);
    seed = r.seed;
    return r.value;
  };

  const activity = getActivity(activityId);

  let stats = applyStatDelta({ ...state.stats }, activity.stats);
  // La forma se cae sola: hay que sostenerla compitiendo.
  let form = clamp(state.form + activity.form - 1);
  // Recuperación pasiva mínima: la fatiga baja si la cuidás, no por inercia.
  const fatigue = clamp(state.fatigue + activity.fatigue - 1);
  const relations = applyRelations(state.relations, activity.relations);

  // Fatiga alta castiga forma y stats
  if (fatigue >= 70) {
    form = clamp(form - 3);
    stats = applyStatDelta(stats, { mentality: -2, mechanics: -1 });
  }
  if (fatigue >= 85) {
    form = clamp(form - 5);
    stats = applyStatDelta(stats, { mentality: -4, gameSense: -2 });
  }

  const turn = state.turn + 1;
  let next: CareerState = {
    ...state,
    stats,
    form,
    fatigue,
    relations,
    lastActivity: activityId,
    turn,
    rngSeed: seed,
    lastNotice: activity.notice,
    ticker: tickerFor(activityId, state),
    phase: 'hub',
    currentEventId: null,
  };

  next = maybePromote(next);

  const claim = claimObjectives(next);
  if (claim.claimed.length > 0) {
    next = {
      ...claim.state,
      lastNotice: `Objetivo cumplido: ${claim.claimed[0]!.label} — ${claim.claimed[0]!.rewardLabel}`,
      ticker: [`OBJETIVO · ${claim.claimed[0]!.label}`, ...next.ticker],
    };
  }

  if (turn >= next.maxTurns) {
    next = { ...next, endingId: resolveEnding(next), phase: 'hub' };
    return { kind: 'ending', state: next };
  }

  // Match day explícito, o llamado según etapa y actividad
  const stageOrder = pack.stages.find((s) => s.id === next.stageId)?.order ?? 1;
  let goMatch = activityId === 'match';
  if (!goMatch && stageOrder >= 2 && (activityId === 'scrim' || activityId === 'soloq')) {
    goMatch = roll() < 0.28;
  }
  if (!goMatch && stageOrder >= 3 && turn % 3 === 0) {
    goMatch = roll() < 0.45;
  }

  if (goMatch) {
    return {
      kind: 'match',
      state: { ...next, phase: 'match', lastActivity: 'match' },
    };
  }

  return { kind: 'event', state: { ...next, phase: 'event' } };
}

export { applyRelations };
