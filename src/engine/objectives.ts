import { applyStatDelta } from './createCareer';
import type { CareerState, Stats } from './types';

export interface Objective {
  id: string;
  label: string;
  hint: string;
  /** Progreso actual y meta, para dibujar la barra */
  current: (s: CareerState) => number;
  target: number;
  reward: Partial<Stats>;
  rewardLabel: string;
  /** Etapa mínima para que aparezca (orden numérico) */
  minStage?: number;
}

const STAGE_ORDER = ['soloq', 'academy', 'challengers', 'tier1', 'worlds'];

function stageIndex(id: string) {
  const i = STAGE_ORDER.indexOf(id);
  return i >= 0 ? i : 0;
}

/**
 * Metas tipo sponsor: dan dirección a la semana y se cobran solas.
 * Es lo que la gente pide en los foros: saber para qué está jugando.
 */
export const OBJECTIVES: Objective[] = [
  {
    id: 'obj_first_wins',
    label: 'Ganá 2 series',
    hint: 'Los scouts quieren ver resultados, no solo LP.',
    current: (s) => s.wins,
    target: 2,
    reward: { reputation: 8, money: 6 },
    rewardLabel: 'Rep +8 · Plata +6',
  },
  {
    id: 'obj_mechanics_70',
    label: 'Mecánicas a 70',
    hint: 'SoloQ y drills hasta que las manos no fallen.',
    current: (s) => s.stats.mechanics ?? 0,
    target: 70,
    reward: { reputation: 6, gameSense: 4 },
    rewardLabel: 'Rep +6 · Game sense +4',
  },
  {
    id: 'obj_team_60',
    label: 'Teamplay a 60',
    hint: 'Scrims y VOD: el roster tiene que confiar en vos.',
    current: (s) => s.stats.teamwork ?? 0,
    target: 60,
    reward: { mentality: 6, reputation: 5 },
    rewardLabel: 'Mentalidad +6 · Rep +5',
    minStage: 1,
  },
  {
    id: 'obj_coach_75',
    label: 'Coach al 75',
    hint: 'Aceptá el lab, bancá la review.',
    current: (s) => s.relations.coach,
    target: 75,
    reward: { gameSense: 8 },
    rewardLabel: 'Game sense +8',
    minStage: 1,
  },
  {
    id: 'obj_rep_80',
    label: 'Reputación a 80',
    hint: 'Contenido, MVPs y no romper el vestuario.',
    current: (s) => s.stats.reputation ?? 0,
    target: 80,
    reward: { money: 14 },
    rewardLabel: 'Plata +14',
    minStage: 2,
  },
  {
    id: 'obj_six_wins',
    label: 'Ganá 6 series',
    hint: 'Sostener el nivel es más difícil que alcanzarlo.',
    current: (s) => s.wins,
    target: 6,
    reward: { reputation: 12, mentality: 5 },
    rewardLabel: 'Rep +12 · Mentalidad +5',
    minStage: 2,
  },
];

/** Los 2 objetivos activos: el primero sin cobrar de cada nivel. */
export function activeObjectives(state: CareerState, limit = 2): Objective[] {
  const stage = stageIndex(state.stageId);
  return OBJECTIVES.filter(
    (o) => (o.minStage ?? 0) <= stage && !state.claimedObjectives.includes(o.id)
  ).slice(0, limit);
}

export function objectiveProgress(o: Objective, state: CareerState): number {
  return Math.max(0, Math.min(100, (o.current(state) / o.target) * 100));
}

/** Cobra automáticamente los objetivos cumplidos y devuelve los avisos. */
export function claimObjectives(state: CareerState): {
  state: CareerState;
  claimed: Objective[];
} {
  const stage = stageIndex(state.stageId);
  const ready = OBJECTIVES.filter(
    (o) =>
      (o.minStage ?? 0) <= stage &&
      !state.claimedObjectives.includes(o.id) &&
      o.current(state) >= o.target
  );

  if (ready.length === 0) return { state, claimed: [] };

  let stats = state.stats;
  for (const o of ready) stats = applyStatDelta(stats, o.reward);

  return {
    state: {
      ...state,
      stats,
      claimedObjectives: [...state.claimedObjectives, ...ready.map((o) => o.id)],
    },
    claimed: ready,
  };
}
