import type { CareerState, ContentPack, Stats } from './types';

const STAGE_ORDER = ['soloq', 'academy', 'challengers', 'tier1', 'worlds'] as const;

function stageIndex(id: string): number {
  const i = STAGE_ORDER.indexOf(id as (typeof STAGE_ORDER)[number]);
  return i >= 0 ? i : 0;
}

function scoreCareer(stats: Stats, stageId: string): number {
  const s =
    (stats.mechanics ?? 0) * 0.22 +
    (stats.gameSense ?? 0) * 0.2 +
    (stats.mentality ?? 0) * 0.15 +
    (stats.teamwork ?? 0) * 0.18 +
    (stats.reputation ?? 0) * 0.2 +
    (stats.money ?? 0) * 0.05;
  return s + stageIndex(stageId) * 8;
}

/**
 * Progresión automática según avance de la partida + stats.
 * Así la duración elegida “estira” o comprime el arco sin sentir vacío.
 */
export function maybePromote(state: CareerState): CareerState {
  const p = state.turn / state.maxTurns;
  const m = state.stats.mechanics ?? 0;
  const g = state.stats.gameSense ?? 0;
  const t = state.stats.teamwork ?? 0;
  const r = state.stats.reputation ?? 0;
  const ment = state.stats.mentality ?? 0;
  const cur = stageIndex(state.stageId);

  let target = state.stageId;
  let notice: string | null = null;

  if (cur < 1 && p >= 0.18 && m >= 48 && g >= 40) {
    target = 'academy';
    notice = 'Te firmaron en Academy / Tier 3.';
  }
  if (cur < 2 && p >= 0.38 && m >= 58 && (t >= 42 || r >= 45)) {
    target = 'challengers';
    notice = 'Subís a Challengers. La competencia se pone seria.';
  }
  if (cur < 3 && p >= 0.58 && m >= 68 && g >= 60 && r >= 55) {
    target = 'tier1';
    notice = 'Contrato Tier 1. Estás en el mapa global.';
  }
  if (cur < 4 && p >= 0.78 && m >= 75 && g >= 70 && t >= 60 && ment >= 50) {
    target = 'worlds';
    notice = 'Clasificás al circuito internacional.';
  }

  // Empujón suave si la partida avanza y estás atrasado de etapa
  if (target === state.stageId) {
    if (cur === 0 && p >= 0.35 && m >= 42) {
      target = 'academy';
      notice = 'Una org local te da chance en Academy.';
    } else if (cur === 1 && p >= 0.55 && (m >= 52 || r >= 50)) {
      target = 'challengers';
      notice = 'Playoffs regionales: entras a Challengers.';
    } else if (cur === 2 && p >= 0.75 && m >= 60) {
      target = 'tier1';
      notice = 'Call-up de emergencia a Tier 1.';
    }
  }

  if (target === state.stageId) {
    return state;
  }

  return {
    ...state,
    stageId: target,
    flags: { ...state.flags, peakStage: target },
    lastNotice: notice,
  };
}

export function resolveEnding(state: CareerState): string {
  const score = scoreCareer(state.stats, state.stageId);
  const stage = stageIndex(state.stageId);
  const ment = state.stats.mentality ?? 0;
  const money = state.stats.money ?? 0;

  if (ment < 18) return 'burnout';
  if (money < 5 && stage <= 1) return 'broke_amateur';

  if (stage >= 4 && score >= 95) return 'world_finalist';
  if (stage >= 4 && score >= 82) return 'international_regular';
  if (stage >= 3 && score >= 78) return 'tier1_starter';
  if (stage >= 3) return 'tier1_bench';
  if (stage >= 2 && score >= 70) return 'challengers_legend';
  if (stage >= 2) return 'stuck_challengers';
  if (stage >= 1 && score >= 60) return 'academy_captain';
  if (score >= 50) return 'regional_grinder';
  return 'elo_hell';
}
