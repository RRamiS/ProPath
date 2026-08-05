/**
 * Temporadas infinitas + edad + retiro.
 * Soft ≥35, hard ≥40: el meta se pone hostil, no hay game over seco.
 */
import { weeklyRent } from './economy';
import { resolveEnding } from './progression';
import type { CareerState } from './types';

export const AGE_SOFT = 35;
export const AGE_HARD = 40;
export const START_AGE = 17;

export function agePressure(age: number) {
  const soft = age >= AGE_SOFT;
  const hard = age >= AGE_HARD;
  return {
    soft,
    hard,
    /** Extra form decay al cerrar la semana */
    formDecay: hard ? 4 : soft ? 2 : 0,
    /** Fatiga extra en series */
    matchFatigue: hard ? 4 : soft ? 2 : 0,
    /** Penalización en momentum de partido */
    matchPenalty: hard ? 0.45 : soft ? 0.2 : 0,
    /** Recuperación de descanso peor */
    restNerf: hard ? 0.55 : soft ? 0.75 : 1,
    label: hard
      ? 'El circuito te mira como veterano. Cada serie cuesta más.'
      : soft
        ? 'Los scouts preguntan por tu edad. Hay que rendir el doble.'
        : null,
  };
}

export function seasonProgress(state: CareerState): number {
  return Math.min(1, state.weekInSeason / Math.max(1, state.maxTurns));
}

/** Progreso de carrera para promociones: temporadas cuentan, no un techo duro. */
export function careerArcProgress(state: CareerState): number {
  const seasonBoost = Math.min(0.7, (state.season - 1) * 0.18);
  return Math.min(0.95, seasonBoost + seasonProgress(state) * 0.28);
}

/**
 * Cierra la temporada: cobra alquiler acumulado ya aplicado semanalmente,
 * suma un año, y deja al jugador en seasonBreak.
 */
export function closeSeason(state: CareerState): CareerState {
  const ageYears = state.ageYears + 1;
  const pressure = agePressure(ageYears);
  const prevWins = state.seasonWins;
  const prevLosses = state.seasonLosses;
  const notice = pressure.hard
    ? `Temporada ${state.season} cerrada (${prevWins}V–${prevLosses}D). Tenés ${ageYears} años. El retiro llama.`
    : pressure.soft
      ? `Temporada ${state.season} cerrada (${prevWins}V–${prevLosses}D). ${ageYears} años. El cuerpo ya no perdona.`
      : `Temporada ${state.season} cerrada (${prevWins}V–${prevLosses}D). Arranca la ${state.season + 1}.`;

  return {
    ...state,
    ageYears,
    season: state.season + 1,
    weekInSeason: 0,
    // Guardamos el split anterior en flags para el resumen de UI
    flags: {
      ...state.flags,
      lastSeasonWins: prevWins,
      lastSeasonLosses: prevLosses,
    },
    seasonWins: 0,
    seasonLosses: 0,
    claimedObjectives: [],
    phase: 'seasonBreak',
    daypart: 'day',
    currentEventId: null,
    lastNotice: notice,
    ticker: [
      `FIN DE TEMPORADA ${state.season}`,
      `${prevWins}V–${prevLosses}D`,
      `${ageYears} años`,
      ...state.ticker,
    ],
  };
}

export function continueSeason(state: CareerState): CareerState {
  if (state.phase !== 'seasonBreak') return state;
  return {
    ...state,
    phase: 'hub',
    lastNotice: `Temporada ${state.season}. Semana 1. A laburar.`,
    ticker: [`TEMPORADA ${state.season}`, ...state.ticker],
  };
}

/** Retiro voluntario o forzado: fija ending y sale a legacy. */
export function retire(state: CareerState, forced = false): CareerState {
  const endingId = resolveEnding(state, { voluntary: !forced });
  return {
    ...state,
    endingId,
    phase: 'hub',
    lastNotice: forced
      ? 'El cuerpo y el meta te sacaron. Es el retiro.'
      : 'Colgaste los periféricos. Carrera cerrada.',
    ticker: [forced ? 'RETIRO FORZADO' : 'RETIRO', ...state.ticker],
  };
}

/**
 * A los 40+ cada fin de temporada hay chance creciente de que el org
 * no renueve. No es instant kill: hay que resistir varias veces.
 */
export function maybeForceRetire(state: CareerState, roll: number): CareerState | null {
  if (state.ageYears < AGE_HARD) return null;
  const yearsOver = state.ageYears - AGE_HARD;
  const chance = Math.min(0.85, 0.25 + yearsOver * 0.15);
  if (roll >= chance) return null;
  return retire(state, true);
}

/** Alquiler al cerrar la semana. */
export function applyWeeklyCosts(state: CareerState): CareerState {
  const rent = weeklyRent(state);
  const cash = Math.max(0, state.cash - rent);
  const broke = cash === 0 && state.cash < rent;
  return {
    ...state,
    cash,
    lastNotice: broke
      ? `Alquiler $${rent}. Quedaste en cero — la semana duele.`
      : state.lastNotice,
    fatigue: broke ? Math.min(100, state.fatigue + 4) : state.fatigue,
    form: broke ? Math.max(0, state.form - 2) : state.form,
  };
}
