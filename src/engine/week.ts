import { applyStatDelta, nextRng } from './createCareer';
import { setupBonuses } from './economy';
import { claimObjectives } from './objectives';
import { maybePromote } from './progression';
import { relationBonuses } from './relations';
import {
  agePressure,
  applyWeeklyCosts,
  closeSeason,
  isMidSeasonDue,
  maybeForceRetire,
} from './season';
import { decayThreads } from './memory';
import { tickNpcWorld } from './npcDirector';
import { gainRoleMastery, roleTrainingBoost } from './role';
import { venueAllows } from './venues';
import { activityChoicesFor, scaleActivityChoice } from './activityChoices';
import { activityReportLine } from './activityReport';
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
    label: 'Ranked solo',
    blurb: 'Partidas ranked por tu cuenta. Suben las manos; cansa la cabeza.',
    stats: { mechanics: 4, gameSense: 2, mentality: -2 },
    form: 3,
    fatigue: 9,
    relations: { rival: 2 },
    notice: 'Ranked solo: manos calientes, cabeza cargada.',
    slots: ['day', 'night'],
    prop: 'rig',
  },
  {
    id: 'scrim',
    label: 'Entrenar en equipo',
    blurb: 'Bloques con tu roster. Sube juego en equipo y confianza.',
    stats: { teamwork: 5, gameSense: 2, mechanics: 2 },
    form: 2,
    fatigue: 11,
    relations: { coach: 3, duo: 4 },
    notice: 'Entrenamiento denso. El roster respira junto.',
    minStageOrder: 2,
    slots: ['day'],
    prop: 'board',
  },
  {
    id: 'vod',
    label: 'Repasar partidas',
    blurb: 'Mirás tus juegos con el coach. Menos ego, más lectura.',
    stats: { gameSense: 6, mentality: 2 },
    form: 0,
    fatigue: -4,
    relations: { coach: 3 },
    notice: 'Repaso: menos ego, más lectura de mapa.',
    slots: ['day', 'night'],
    prop: 'tv',
  },
  {
    id: 'rest',
    label: 'Descansar',
    blurb:
      'Bajá fatiga y recuperá cabeza. En casa dormís; en el gym el cuerpo vuelve más fuerte (más forma).',
    stats: { mentality: 7, mechanics: -1 },
    form: 2,
    fatigue: -22,
    relations: {},
    notice: 'Descanso. Fatiga baja, la mente vuelve.',
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
  {
    id: 'conditioning',
    label: 'Entrenamiento físico',
    blurb: 'Pesas, core, movilidad de competitivo. Sube forma; cansa el cuerpo.',
    stats: { mentality: 2, mechanics: 2 },
    form: 5,
    fatigue: 10,
    relations: {},
    notice: 'Gym duro. La forma responde.',
    slots: ['day'],
    prop: 'board',
  },
  {
    id: 'physio',
    label: 'Fisio / recovery',
    blurb: 'Foam, ojos, siesta corta. Baja fatiga sin apagar del todo la forma.',
    stats: { mentality: 4, mechanics: -1 },
    form: 1,
    fatigue: -16,
    relations: {},
    notice: 'Fisio hecho. El cuerpo vuelve.',
    slots: ['day', 'night'],
    prop: 'shelf',
  },
  {
    id: 'hangout',
    label: 'Café con gente',
    blurb: 'Mesa, chisme, meta. Relaciones primero; el grind espera.',
    stats: { mentality: 3, reputation: 1 },
    form: 0,
    fatigue: -3,
    relations: { duo: 3, manager: 2 },
    notice: 'Café cerrado. El círculo suma.',
    slots: ['day', 'night'],
    prop: 'board',
  },
];

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function getActivity(id: WeekActivityId): WeekActivity {
  return WEEK_ACTIVITIES.find((a) => a.id === id) ?? WEEK_ACTIVITIES[0]!;
}

function slotAllows(activity: WeekActivity, state: CareerState): boolean {
  if (activity.slots.includes(state.daypart)) return true;
  // El café de día no puede quedar vacío: contenido también vale ahí.
  return activity.id === 'content' && state.venueId === 'cafe';
}

export function availableActivities(state: CareerState, pack: ContentPack): WeekActivity[] {
  const order = pack.stages.find((s) => s.id === state.stageId)?.order ?? 1;
  return WEEK_ACTIVITIES.filter(
    (a) =>
      (a.minStageOrder ?? 0) <= order &&
      slotAllows(a, state) &&
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

/** Cobra objetivos y deja rastro visible en HUD/sala. */
export function applyObjectiveClaims(state: CareerState): CareerState {
  const claim = claimObjectives(state);
  if (claim.claimed.length === 0) return state;
  const first = claim.claimed[0]!;
  const rewardCash = Math.round((first.reward.money ?? 0) * 10);
  let next: CareerState = {
    ...claim.state,
    cash: claim.state.cash + rewardCash,
    lastNotice: `Objetivo cumplido: ${first.label} — ${first.rewardLabel}`,
    ticker: [
      `OBJETIVO · ${first.label}`,
      first.rewardLabel,
      ...claim.state.ticker,
    ].slice(0, 8),
    flags: {
      ...claim.state.flags,
      lastClaimedObjective: first.id,
      claimFlashUntil: state.turn + 2,
      claimBannerUntil: state.turn + 3,
    },
  };
  // Un poco de maestría para que el claim se sienta en el HUD.
  next = gainRoleMastery(next, 3);
  return next;
}

function tickerFor(activity: WeekActivityId, state: CareerState): string[] {
  const name = state.profile.name;
  switch (activity) {
    case 'soloq':
      return [`${name} en ranked solo`, 'Manos calientes, cabeza cargada'];
    case 'scrim':
      return ['Entrenamiento con el roster', 'Juego en equipo en subida'];
    case 'vod':
      return ['Repaso de partidas', 'Menos ego, más lectura'];
    case 'rest':
      return state.venueId === 'gym'
        ? ['Gym · cuerpo primero', 'Fatiga baja más que en casa']
        : ['Descanso en casa', 'Fatiga baja, mente vuelve'];
    case 'conditioning':
      return ['Gym · conditioning', 'Forma en subida'];
    case 'physio':
      return ['Fisio / recovery', 'Fatiga bajando'];
    case 'hangout':
      return ['Café · mesa abierta', 'El círculo suma'];
    case 'content':
      return ['Contenido out', 'La marca suma'];
    case 'match':
      return ['MATCH DAY', `${name} en el draft room`];
    default:
      return [];
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
  activityId: WeekActivityId,
  /** Variante elegida (3 opciones al tocar el objeto). */
  variantId?: string,
  /** Si la variante pedía skill check, si lo pasó. */
  variantOk = true
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
  const roleBoost = roleTrainingBoost(pack, state, activityId);
  for (const [k, v] of Object.entries(roleBoost)) {
    if (typeof v === 'number') boosted[k] = (boosted[k] ?? 0) + v;
  }

  // Contenido paga cash real, no solo el stat.
  let cashGain = 0;
  if (activityId === 'content') {
    const base = Math.round((boosted.money ?? 5) * 8 * perks.moneyMult);
    cashGain = base + setup.contentCash;
    delete boosted.money;
  }

  let variant = variantId
    ? activityChoicesFor(activityId, state.venueId)?.find((v) => v.id === variantId)
    : undefined;
  if (variant && !variantOk) {
    variant = scaleActivityChoice(variant, false);
  }
  if (variant?.effect.stats) {
    for (const [k, v] of Object.entries(variant.effect.stats)) {
      if (typeof v === 'number') {
        if (k === 'money') {
          cashGain += Math.round(v * 8);
        } else {
          boosted[k] = (boosted[k] ?? 0) + v;
        }
      }
    }
  }

  let stats = applyStatDelta({ ...state.stats }, boosted);
  let form = clamp(state.form + impact.form + (variant?.effect.form ?? 0));
  let fatigueDelta = impact.fatigue + (variant?.effect.fatigue ?? 0);
  if (activityId === 'rest') {
    fatigueDelta = Math.round(fatigueDelta * age.restNerf) + setup.restFatigue;
    form = clamp(form + setup.restForm);
    // Sin plata: dormís mal (comida / estrés).
    if (state.cash < 12) {
      fatigueDelta = Math.round(fatigueDelta * 0.65);
      form = clamp(form - 1);
    }
    // El gym no es lo mismo que la cama: más recovery y un empujón de forma.
    if (state.venueId === 'gym') {
      fatigueDelta -= 8;
      form = clamp(form + 3);
      stats = applyStatDelta(stats, { mentality: 2 });
    }
  }
  let fatigue = clamp(state.fatigue + fatigueDelta);
  let relations = applyRelations(state.relations, impact.relations);
  if (variant?.effect.relations) {
    relations = applyRelations(relations, variant.effect.relations);
  }
  if (variant?.effect.flags) {
    state = { ...state, flags: { ...state.flags, ...variant.effect.flags } };
  }

  const noticeFor = () => {
    if (variant) return cashGain ? `${variant.notice} +$${cashGain}` : variant.notice;
    if (cashGain) return `${activity.notice} +$${cashGain}`;
    if (activityId === 'rest' && state.cash < 12) {
      return 'Descanso flojo: sin plata se duerme mal. Contenido o un win pagan la semana.';
    }
    if (activityId === 'rest' && state.venueId === 'gym') {
      return 'Gym: bajás más fatiga y subís forma. No es lo mismo que dormir en casa.';
    }
    return activity.notice;
  };

  if (!impact.closesWeek) {
    const masteryGain =
      activityId === 'rest' ||
      activityId === 'content' ||
      activityId === 'physio' ||
      activityId === 'hangout'
        ? 0
        : activityId === 'vod' ||
            activityId === 'scrim' ||
            activityId === 'soloq' ||
            activityId === 'conditioning'
          ? 2
          : 1;
    let slotState: CareerState = {
      ...state,
      stats,
      form,
      fatigue,
      relations,
      cash: state.cash + cashGain,
      daypart: 'night',
      lastActivity: activityId,
      rngSeed: seed,
      lastNotice: '',
      ticker: tickerFor(activityId, state),
      phase: 'hub',
      currentEventId: null,
      currentSituation: null,
    };
    if (masteryGain) slotState = gainRoleMastery(slotState, masteryGain);
    slotState = {
      ...slotState,
      lastNotice: activityReportLine(activityId, slotState, noticeFor()),
    };
    slotState = applyObjectiveClaims(slotState);
    return { kind: 'slot', state: slotState };
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
    lastNotice: activityReportLine(activityId, { ...state, form, fatigue, relations, stats }, noticeFor()),
    ticker: tickerFor(activityId, state),
    phase: 'hub',
    currentEventId: null,
    currentSituation: null,
  };

  next = applyWeeklyCosts(next);
  next = maybePromote(next);
  next = decayThreads(next);
  next = tickNpcWorld(next, isMatchWeek(next, pack));

  next = applyObjectiveClaims(next);

  const stageOrder = pack.stages.find((s) => s.id === next.stageId)?.order ?? 1;
  let goMatch = activityId === 'match' || isMatchWeek(state, pack);
  if (!goMatch && stageOrder >= 2 && activityId === 'scrim') {
    goMatch = roll() < 0.2;
  }
  // Tras el trash talk del showdown, la próxima serie es personal — no espera fixture.
  if (!goMatch && Number(next.flags.rivalShowdownPending ?? 0) === 1 && stageOrder >= 2) {
    goMatch = true;
  }

  // La serie se juega aunque sea la última semana; el break viene después.
  if (goMatch) {
    if (isMidSeasonDue(next)) {
      next = {
        ...next,
        flags: { ...next.flags, pendingMidSeason: 1 },
      };
    }
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
