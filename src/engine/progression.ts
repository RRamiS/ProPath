import type { CareerState, Stats } from './types';
import { careerArcProgress } from './season';

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

function winRate(state: CareerState): number {
  const total = state.wins + state.losses;
  if (total === 0) return 0.5;
  return state.wins / total;
}

/**
 * Progresión automática según arco de carrera (temporadas) + stats.
 * Ya no depende de un hard-end a maxTurns.
 */
export function maybePromote(state: CareerState): CareerState {
  const p = careerArcProgress(state);
  const m = state.stats.mechanics ?? 0;
  const g = state.stats.gameSense ?? 0;
  const t = state.stats.teamwork ?? 0;
  const r = state.stats.reputation ?? 0;
  const ment = state.stats.mentality ?? 0;
  const cur = stageIndex(state.stageId);
  const wr = winRate(state);

  let target = state.stageId;
  let notice: string | null = null;

  if (cur < 1 && p >= 0.12 && m >= 48 && g >= 40) {
    target = 'academy';
    notice = 'Te firmaron en Academy / Tier 3.';
  }
  if (cur < 2 && p >= 0.28 && m >= 58 && (t >= 42 || r >= 45)) {
    target = 'challengers';
    notice = 'Subís a Challengers. La competencia se pone seria.';
  }
  if (cur < 3 && p >= 0.45 && m >= 68 && g >= 60 && r >= 55 && wr >= 0.45) {
    target = 'tier1';
    notice = 'Contrato Tier 1. Estás en el mapa global.';
  }
  if (
    cur < 4 &&
    p >= 0.62 &&
    m >= 75 &&
    g >= 70 &&
    t >= 60 &&
    ment >= 50 &&
    wr >= 0.55 &&
    state.wins >= 3
  ) {
    target = 'worlds';
    notice = 'Clasificás al circuito internacional.';
  }

  if (target === state.stageId) {
    if (cur === 0 && (p >= 0.22 || state.season >= 2) && m >= 42) {
      target = 'academy';
      notice = 'Una org local te da chance en Academy.';
    } else if (cur === 1 && (p >= 0.4 || state.season >= 2) && (m >= 52 || r >= 50)) {
      target = 'challengers';
      notice = 'Playoffs regionales: entras a Challengers.';
    } else if (cur === 2 && (p >= 0.55 || state.season >= 3) && m >= 60 && wr >= 0.4) {
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

export function resolveEnding(state: CareerState, opts?: { voluntary?: boolean }): string {
  const stage = stageIndex(state.stageId);
  const ment = state.stats.mentality ?? 0;
  const money = state.cash;
  const played = state.wins + state.losses;
  const wr = winRate(state);

  const recordBonus = played === 0 ? -8 : (wr - 0.5) * 34 + Math.min(9, state.wins * 1.5);
  const burnPenalty = state.fatigue >= 90 ? -6 : 0;
  const longevity = Math.min(12, (state.season - 1) * 3);
  const score = scoreCareer(state.stats, state.stageId) + recordBonus + burnPenalty + longevity;

  if (!opts?.voluntary && ment < 18) return 'burnout';
  if (money < 15 && stage <= 1) return 'broke_amateur';

  if (stage >= 4 && score >= 95 && state.wins >= 4 && wr >= 0.55) return 'world_finalist';
  if (stage >= 4 && score >= 82) return 'international_regular';
  if (stage >= 3 && score >= 78) return 'tier1_starter';
  if (stage >= 3) return 'tier1_bench';
  if (stage >= 2 && score >= 70) return 'challengers_legend';
  if (stage >= 2) return 'stuck_challengers';
  if (stage >= 1 && score >= 60) return 'academy_captain';
  if (score >= 50) return 'regional_grinder';
  return 'elo_hell';
}
