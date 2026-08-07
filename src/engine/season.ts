/**
 * Temporadas infinitas + edad + retiro.
 * Soft ≥35, hard ≥40: el meta se pone hostil, no hay game over seco.
 */
import { weeklyLivingCost } from './economy';
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

/** Semana 0-based donde cae el beat de mitad de split. */
export function midSeasonWeek(state: CareerState): number {
  return Math.max(1, Math.floor(state.maxTurns / 2));
}

export function midSeasonFlagKey(season: number): string {
  return `midSeason_${season}`;
}

export function isMidSeasonDue(state: CareerState): boolean {
  return (
    state.weekInSeason === midSeasonWeek(state) &&
    !state.flags[midSeasonFlagKey(state.season)]
  );
}

export type SeasonGrade = 'hot' | 'ok' | 'cold';

export function gradeSeason(wins: number, losses: number): SeasonGrade {
  const games = wins + losses;
  if (games === 0) return 'ok';
  const wr = wins / games;
  if (wins >= 2 && wr >= 0.55) return 'hot';
  if (wins === 0 && losses >= 2) return 'cold';
  if (wr < 0.35) return 'cold';
  return 'ok';
}

export function seasonGradeLabel(grade: SeasonGrade): string {
  if (grade === 'hot') return 'HOT';
  if (grade === 'cold') return 'COLD';
  return 'OK';
}

export function seasonReviewBlurb(grade: SeasonGrade, wins: number, losses: number): string {
  if (grade === 'hot') {
    return `El staff mira el ${wins}V–${losses}D y sonríe. Hay bono sobre la mesa — o podés apretar por más.`;
  }
  if (grade === 'cold') {
    return `El board frunce el ceño con ${wins}V–${losses}D. Te ofrecen un contrato flojo… o bancarte el lab y pelear el spot.`;
  }
  return `Split correcto (${wins}V–${losses}D). Renovación estándar: sin fiesta, sin corte.`;
}

export type SeasonOfferId = 'take_deal' | 'push_hard' | 'grind_prove';

export function seasonOfferChoices(grade: SeasonGrade): Array<{
  id: SeasonOfferId;
  label: string;
  blurb: string;
}> {
  if (grade === 'hot') {
    return [
      {
        id: 'take_deal',
        label: 'Cobrar el bono',
        blurb: '+$55 · rep · manager feliz',
      },
      {
        id: 'push_hard',
        label: 'Pedir más',
        blurb: '+$80 · roce con el board · +mente',
      },
    ];
  }
  if (grade === 'cold') {
    return [
      {
        id: 'take_deal',
        label: 'Firmar el corte',
        blurb: '−$15 · mantenés el spot · coach +',
      },
      {
        id: 'grind_prove',
        label: 'Bancarte el lab',
        blurb: '+forma · +mente · sin plata',
      },
    ];
  }
  return [
    {
      id: 'take_deal',
      label: 'Renovar quieto',
      blurb: '+$30 · relaciones estables',
    },
    {
      id: 'push_hard',
      label: 'Pedir un plus',
      blurb: '+$45 · manager − · rival +',
    },
  ];
}

/** Aplica la oferta de fin de split (una vez). */
export function resolveSeasonOffer(
  state: CareerState,
  choiceId: SeasonOfferId
): CareerState {
  if (!state.flags.seasonOfferPending) return state;
  const grade = (state.flags.seasonReviewGrade as SeasonGrade) || 'ok';
  let cash = state.cash;
  let form = state.form;
  let mentality = state.stats.mentality ?? 0;
  let reputation = state.stats.reputation ?? 0;
  const relations = { ...state.relations };
  let notice = 'Oferta resuelta.';

  if (grade === 'hot') {
    if (choiceId === 'push_hard') {
      cash += 80;
      mentality += 3;
      relations.manager = Math.max(0, relations.manager - 3);
      relations.coach = Math.min(100, relations.coach + 2);
      notice = 'Pediste más y lo sacaste. El board no lo olvida — ni el depósito.';
    } else {
      cash += 55;
      reputation += 4;
      relations.manager = Math.min(100, relations.manager + 5);
      notice = 'Cobraste el bono de split. El manager asiente.';
    }
  } else if (grade === 'cold') {
    if (choiceId === 'grind_prove') {
      form = Math.min(100, form + 6);
      mentality += 5;
      relations.coach = Math.min(100, relations.coach + 4);
      notice = 'Rechazaste el corte. Lab duro: el spot se pelea con sangre.';
    } else {
      cash = Math.max(0, cash - 15);
      relations.coach = Math.min(100, relations.coach + 3);
      relations.manager = Math.min(100, relations.manager + 2);
      notice = 'Firmaste el corte. Seguís adentro — más pobre, menos ruido.';
    }
  } else if (choiceId === 'push_hard') {
    cash += 45;
    relations.manager = Math.max(0, relations.manager - 2);
    relations.rival = Math.min(100, relations.rival + 3);
    notice = 'Sacaste un plus chico. El rival se enteró.';
  } else {
    cash += 30;
    relations.manager = Math.min(100, relations.manager + 3);
    relations.coach = Math.min(100, relations.coach + 2);
    notice = 'Renovación quieta. El split siguiente empieza estable.';
  }

  return {
    ...state,
    cash,
    form,
    relations,
    stats: {
      ...state.stats,
      mentality: Math.max(0, Math.min(100, mentality)),
      reputation: Math.max(0, Math.min(100, reputation)),
    },
    flags: {
      ...state.flags,
      seasonOfferPending: 0,
    },
    lastNotice: notice,
    ticker: ['OFERTA · SPLIT', ...state.ticker],
  };
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
  const grade = gradeSeason(prevWins, prevLosses);
  const notice = pressure.hard
    ? `Temporada ${state.season} cerrada (${prevWins}V–${prevLosses}D). Tenés ${ageYears} años. El retiro llama.`
    : pressure.soft
      ? `Temporada ${state.season} cerrada (${prevWins}V–${prevLosses}D). ${ageYears} años. El cuerpo ya no perdona.`
      : `Temporada ${state.season} cerrada (${prevWins}V–${prevLosses}D · review ${seasonGradeLabel(grade)}).`;

  return {
    ...state,
    ageYears,
    season: state.season + 1,
    weekInSeason: 0,
    flags: {
      ...state.flags,
      lastSeasonWins: prevWins,
      lastSeasonLosses: prevLosses,
      seasonReviewGrade: grade,
      seasonOfferPending: 1,
    },
    seasonWins: 0,
    seasonLosses: 0,
    claimedObjectives: [],
    phase: 'seasonBreak',
    daypart: 'day',
    currentEventId: null,
    currentSituation: null,
    lastNotice: notice,
    ticker: [
      `FIN DE TEMPORADA ${state.season}`,
      `${prevWins}V–${prevLosses}D · ${seasonGradeLabel(grade)}`,
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
    roleSwitchCooldown: Math.max(0, (state.roleSwitchCooldown ?? 0) - 1),
    flags: {
      ...state.flags,
      seasonOfferPending: 0,
    },
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

/** Alquiler + comida al cerrar la semana. Siempre se ve. */
export function applyWeeklyCosts(state: CareerState): CareerState {
  const { rent, food, total } = weeklyLivingCost(state);
  const before = state.cash;
  const cash = Math.max(0, before - total);
  const paid = before - cash;
  const broke = paid < total;
  const tight = cash < 15;

  const notice = broke
    ? `Cuentas $${total} (alquiler $${rent} + comida $${food}). No alcanzaste — la semana duele.`
    : `Cuentas −$${total} (alquiler $${rent} + comida $${food}). Quedan $${cash}.`;

  return {
    ...state,
    cash,
    lastNotice: notice,
    ticker: [`CUENTAS · −$${paid}`, ...state.ticker],
    fatigue: broke
      ? Math.min(100, state.fatigue + 10)
      : tight
        ? Math.min(100, state.fatigue + 2)
        : state.fatigue,
    form: broke
      ? Math.max(0, state.form - 5)
      : tight
        ? Math.max(0, state.form - 1)
        : state.form,
    stats: broke
      ? {
          ...state.stats,
          mentality: Math.max(0, (state.stats.mentality ?? 0) - 3),
        }
      : state.stats,
  };
}
