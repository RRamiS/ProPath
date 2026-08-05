import { applyStatDelta, nextRng } from './createCareer';
import { maybePromote, resolveEnding } from './progression';
import type {
  CareerState,
  ContentPack,
  Relations,
  WeekActivityId,
} from './types';

export interface WeekActivity {
  id: WeekActivityId;
  label: string;
  hint: string;
  /** Solo visible desde cierta etapa */
  minStageOrder?: number;
}

export const WEEK_ACTIVITIES: WeekActivity[] = [
  {
    id: 'soloq',
    label: 'Grind SoloQ',
    hint: '+mecánicas · +forma · +fatiga',
  },
  {
    id: 'scrim',
    label: 'Scrims de team',
    hint: '+teamplay · +confianza coach/duo',
    minStageOrder: 2,
  },
  {
    id: 'vod',
    label: 'VOD / lab',
    hint: '+game sense · baja un poco fatiga mental',
  },
  {
    id: 'rest',
    label: 'Descansar',
    hint: '−fatiga · +mentalidad · −forma leve',
  },
  {
    id: 'content',
    label: 'Contenido / marca',
    hint: '+reputación · +plata · −teamplay',
  },
  {
    id: 'match',
    label: 'Día de partido',
    hint: 'Partido live · broadcast',
    minStageOrder: 2,
  },
];

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
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
      return [`${name} farmea LP en silence`, ...base];
    case 'scrim':
      return [`Bloque de scrims · coach Marek en voice`, ...base];
    case 'vod':
      return [`Sala de VOD · frame por frame`, ...base];
    case 'rest':
      return [`Día off · recovery protocol`, ...base];
    case 'content':
      return [`Clip subiendo · comunidad activa`, ...base];
    case 'match':
      return [`MATCH DAY · luces en la arena`, `${name} en el draft room`];
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
 * Puede ir a partido live o a evento narrativo.
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

  let stats = { ...state.stats };
  let form = state.form;
  let fatigue = state.fatigue;
  let relations = { ...state.relations };
  let notice: string | null = null;

  switch (activityId) {
    case 'soloq':
      stats = applyStatDelta(stats, { mechanics: 4, gameSense: 2, mentality: -2 });
      form = clamp(form + 3);
      fatigue = clamp(fatigue + 9);
      relations = applyRelations(relations, { rival: 2 });
      notice = 'Semana de SoloQ: manos calientes, cabeza cargada.';
      break;
    case 'scrim':
      stats = applyStatDelta(stats, { teamwork: 5, gameSense: 2, mechanics: 2 });
      form = clamp(form + 2);
      fatigue = clamp(fatigue + 11);
      relations = applyRelations(relations, { coach: 3, duo: 4 });
      notice = 'Scrims densos. El roster respira junto.';
      break;
    case 'vod':
      stats = applyStatDelta(stats, { gameSense: 6, mentality: 2 });
      fatigue = clamp(fatigue - 4);
      relations = applyRelations(relations, { coach: 3 });
      notice = 'Lab de VOD: menos ego, más pattern recognition.';
      break;
    case 'rest':
      stats = applyStatDelta(stats, { mentality: 7, mechanics: -1 });
      form = clamp(form - 2);
      fatigue = clamp(fatigue - 22);
      notice = 'Recovery. El body clock agradece.';
      break;
    case 'content':
      stats = applyStatDelta(stats, { reputation: 6, money: 5, teamwork: -3 });
      fatigue = clamp(fatigue + 5);
      relations = applyRelations(relations, { manager: 4, duo: -1 });
      notice = 'Contenido out. La marca suma; el team mira el reloj.';
      break;
    case 'match':
      form = clamp(form + 1);
      fatigue = clamp(fatigue + 6);
      notice = 'Día de partido. Draft room en 3…';
      break;
  }

  // Fatiga alta castiga forma y stats
  if (fatigue >= 70) {
    form = clamp(form - 4);
    stats = applyStatDelta(stats, { mentality: -2, mechanics: -1 });
  }
  if (fatigue >= 85) {
    form = clamp(form - 6);
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
    lastNotice: notice,
    ticker: tickerFor(activityId, state),
    phase: 'hub',
    currentEventId: null,
  };

  next = maybePromote(next);

  if (turn >= next.maxTurns) {
    next = { ...next, endingId: resolveEnding(next), phase: 'hub' };
    return { kind: 'ending', state: next };
  }

  // Match day explícito o chance según etapa/actividad
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
