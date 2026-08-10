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
  /** Si está definido, solo aparece cuando da true */
  available?: (s: CareerState) => boolean;
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
    id: 'obj_season_wins',
    label: 'Ganá 3 series este split',
    hint: 'Tu meta de temporada: sumá victorias en Match Day.',
    current: (s) => s.seasonWins,
    target: 3,
    reward: { reputation: 7, money: 5 },
    rewardLabel: 'Rep +7 · Plata +5',
  },
  {
    id: 'obj_first_wins',
    label: 'Ganá 2 series',
    hint: 'Los scouts miran resultados. Entrená y llegá listo al partido.',
    current: (s) => s.wins,
    target: 2,
    reward: { reputation: 8, money: 6 },
    rewardLabel: 'Rep +8 · Plata +6',
  },
  {
    id: 'obj_mechanics_70',
    label: 'Mecánicas a 70',
    hint: 'Jugá ranked solo o drills hasta que las manos respondan.',
    current: (s) => s.stats.mechanics ?? 0,
    target: 70,
    reward: { reputation: 6, gameSense: 4 },
    rewardLabel: 'Rep +6 · Lectura +4',
  },
  {
    id: 'obj_team_60',
    label: 'Equipo a 60',
    hint: 'Entrená con el roster y repasá partidas juntos.',
    current: (s) => s.stats.teamwork ?? 0,
    target: 60,
    reward: { mentality: 6, reputation: 5 },
    rewardLabel: 'Mentalidad +6 · Rep +5',
    minStage: 1,
  },
  {
    id: 'obj_rival_showdown',
    label: 'Ganá el showdown vs tu rival',
    hint: 'Primero el desafío. Después, la serie personal.',
    current: (s) => Number(s.flags.rivalShowdownWon ?? 0),
    target: 1,
    reward: { reputation: 10, mentality: 5, money: 8 },
    rewardLabel: 'Rep +10 · Mentalidad +5 · Plata +8',
    minStage: 1,
    available: (s) =>
      Number(s.flags.customsAccepted ?? 0) === 1 ||
      Number(s.flags.rivalShowdownPending ?? 0) === 1 ||
      Number(s.flags.rivalShowdownWon ?? 0) === 1,
  },
  {
    id: 'obj_coach_75',
    label: 'Coach al 75',
    hint: 'Escuchá al coach y bancá las reviews.',
    current: (s) => s.relations.coach,
    target: 75,
    reward: { gameSense: 8 },
    rewardLabel: 'Lectura +8',
    minStage: 1,
  },
  {
    id: 'obj_rep_80',
    label: 'Reputación a 80',
    hint: 'Contenido, buenas series y no romper el vestuario.',
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
    (o) =>
      (o.minStage ?? 0) <= stage &&
      !state.claimedObjectives.includes(o.id) &&
      (o.available?.(state) ?? true)
  ).slice(0, limit);
}

/** El objetivo que el HUD siempre muestra. */
export function primaryObjective(state: CareerState): Objective | null {
  return activeObjectives(state, 1)[0] ?? null;
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
      (o.available?.(state) ?? true) &&
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
