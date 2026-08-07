import { applyStatDelta, nextRng } from '../engine/createCareer';
import { relationBonuses } from '../engine/relations';
import { agePressure } from '../engine/season';
import { esportsPack } from '../content/esports/pack';
import { gainRoleMastery, masteryFactor, roleCallBonus } from '../engine/role';
import type { CareerState, MatchFactor, MatchResult, Relations } from '../engine/types';

export type MatchPhase = 'draft' | 'early' | 'fight' | 'late';

/** Las 4 fases jugables, en orden. El stepper y el contador leen de acá. */
export const MATCH_PHASE_LABELS: string[] = ['Draft', 'Early', 'Fight', 'Cierre'];

/** Línea de play-by-play para el feed del broadcast. */
export function feedLine(phaseIndex: number, choiceId: string): string {
  const lines: Record<string, string> = {
    safe: 'Draft de scaling — apuestan al late',
    prio: 'Se llevan prio de early en el draft',
    flex: 'Pick flex sorpresa: el rival pide pausa mental',
    farm: 'CS limpio y wards en río',
    playmake: 'Buscan la primera pelea del mapa',
    roam: 'Roam a side lane — el mapa se mueve',
    focus: 'Van al carry enemigo sin dudar',
    peel: 'Peel perfecto sobre su propio carry',
    steal: 'Timing de objetivo — todos al pit',
    bail: 'Resetean la pelea y toman torretas',
    close: 'Van directo al nexo sin mirar atrás',
    siege: 'Asedio paciente: torre por torre',
    baron: 'Se juegan el baron con el rival vivo',
    stall: 'Estiran el mapa esperando el error',
  };
  return lines[choiceId] ?? `Fase ${phaseIndex + 1} resuelta`;
}

export interface MatchChoice {
  id: string;
  label: string;
  hint?: string;
  /** Modifica momentum del equipo (-2..+2 tipico) */
  momentum: number;
  formBonus?: number;
}

export interface MatchBeat {
  phase: MatchPhase;
  title: string;
  body: string;
  choices: MatchChoice[];
}

const OPPONENTS = [
  'Nova Five',
  'Iron Circuit',
  'Pulse Gaming',
  'Northline',
  'Eclipse Academy',
  'Redshift',
  'Harbor Esports',
];

export function pickOpponent(seed: number, stageId: string): { name: string; seed: number } {
  const r = nextRng(seed + stageId.length * 17);
  const name = OPPONENTS[Math.floor(r.value * OPPONENTS.length)]!;
  return { name, seed: r.seed };
}

const ROLE_EARLY: Record<string, string> = {
  jungle: 'Pathing: ¿invadir, full clear o gank temprano?',
  mid: 'La mid wave llega. ¿Roameás, pusheás o buscás el 1v1?',
  adc: 'Bot lane: farm seguro o pelear por prio con tu support?',
  support: 'Vision y engages: ¿leés el mapa o pegás con el ADC?',
  top: 'Island: matchup, freeze o TP play. Nadie te cubre.',
};

export function buildMatchBeats(roleId: string): MatchBeat[] {
  return [
    {
      phase: 'draft',
      title: 'Draft room',
      body: `Ban phase. Vas de ${roleId.toUpperCase()}. El coach mira el clipboard. ¿Qué línea abrís?`,
      choices: [
        { id: 'safe', label: 'Draft seguro / scaling', hint: 'Menos riesgo', momentum: 0 },
        { id: 'prio', label: 'Prio de early', hint: 'Presión de mapa', momentum: 1 },
        { id: 'flex', label: 'Flex raro para surprise', hint: 'Alto riesgo', momentum: 0 },
      ],
    },
    {
      phase: 'early',
      title: 'Early game',
      body: ROLE_EARLY[roleId] ?? 'La oleada llega. ¿Cómo jugás los primeros 8 minutos?',
      choices: [
        { id: 'farm', label: 'Farm limpio + vision', momentum: 0, formBonus: 1 },
        { id: 'playmake', label: 'Buscar play temprano', momentum: 1 },
        { id: 'roam', label: 'Roam / ayudar side', momentum: 1 },
      ],
    },
    {
      phase: 'fight',
      title: 'Objetivo / fight',
      body: 'Se arma pelea en el pit. El call es confuso. ¿Qué hacés?',
      choices: [
        { id: 'focus', label: 'Foco al carry', momentum: 2 },
        { id: 'peel', label: 'Peel al vuestro', momentum: 1 },
        { id: 'steal', label: 'Ir al objetivo / smite timing', momentum: 1 },
        { id: 'bail', label: 'Resetear y no pelear', momentum: -1 },
      ],
    },
    {
      phase: 'late',
      title: 'Cierre',
      body: 'Minuto 30. Una decisión mal tomada acá borra todo lo anterior.',
      choices: [
        { id: 'close', label: 'Cerrar ya, todo al nexo', hint: 'Si sale, se acabó', momentum: 2 },
        { id: 'siege', label: 'Asedio paciente', hint: 'Seguro pero lento', momentum: 1 },
        {
          id: 'baron',
          label: 'Baron con el rival vivo',
          hint: 'Altísimo riesgo',
          momentum: 2,
          formBonus: 2,
        },
        { id: 'stall', label: 'Estirar y esperar el error', momentum: -1, formBonus: 1 },
      ],
    },
  ];
}

/** Mapea la barra de impulso (0–100) a un factor de serie legible. */
export function momentumWinChance(momentum: number): number {
  // Alineado al peso real del impulso: la barra se siente más decisiva.
  return Math.round(14 + (Math.max(0, Math.min(100, momentum)) / 100) * 72);
}

export function resolveMatch(
  state: CareerState,
  choices: string[],
  opponent: string,
  /** Impulso final de la barra en vivo (0–100). */
  seriesMomentum = 50
): { result: MatchResult; state: CareerState; seed: number } {
  let seed = state.rngSeed;
  const roll = () => {
    const r = nextRng(seed);
    seed = r.seed;
    return r.value;
  };

  const beats = buildMatchBeats(state.profile.roleId);
  const highlights: string[] = [];
  const factors: MatchFactor[] = [];

  const add = (label: string, value: number) => {
    if (Math.abs(value) < 0.05) return;
    factors.push({ label, value: Math.round(value * 100) / 100 });
  };

  add('Forma', (state.form - 55) / 50);
  add('Fatiga', -(state.fatigue - 40) / 60);
  add('Química con el duo', (state.relations.duo - 45) / 70);
  add('Preparación del coach', (state.relations.coach - 45) / 110);
  add('Mecánicas', (state.stats.mechanics ?? 0) / 200);
  add('Teamplay', (state.stats.teamwork ?? 0) / 220);

  const pack = esportsPack;
  const mastery = masteryFactor(state);
  add(`Maestría · ${state.profile.roleId.toUpperCase()}`, mastery * 0.55 - 0.12);

  const perks = relationBonuses(state);
  const age = agePressure(state.ageYears);
  if (perks.draftEdge) add('Perk · Plan de partido', perks.draftEdge);
  if (perks.fightEdge) add('Perk · Sinergia de lane', perks.fightEdge);
  if (age.matchPenalty) add('Edad / veterano', -age.matchPenalty);

  let callsValue = 0;
  let roleCalls = 0;
  choices.forEach((cid, i) => {
    const beat = beats[i];
    const choice = beat?.choices.find((c) => c.id === cid);
    if (!choice) return;
    // Centrado en momentum 1: la llamada estándar no regala nada. Jugar seguro
    // resta, arriesgar bien suma, y la carrera sigue pesando más que 4 clics.
    callsValue += (choice.momentum - 1) * 0.3;
    if (choice.formBonus) callsValue += choice.formBonus * 0.05;
    roleCalls += roleCallBonus(pack, state, cid);
    if (i === 0 && cid === 'prio') highlights.push('Early prio en draft');
    if (i === 1 && cid === 'playmake') highlights.push('First blood attempt');
    if (i === 2 && cid === 'focus') highlights.push('Foco limpio al carry');
    if (i === 2 && cid === 'steal') highlights.push('Play de objetivo');
    if (i === 3 && cid === 'baron') highlights.push('Baron robado bajo presión');
    if (i === 3 && cid === 'close') highlights.push('Cierre directo al nexo');
  });
  add('Tus llamadas', callsValue);
  add('Lectura de rol', roleCalls);
  // Impulso de la barra en vivo: peso alto para que las fases decidan la serie.
  add('Impulso de la serie', (seriesMomentum - 50) / 32);

  const stagePenalty =
    state.stageId === 'worlds'
      ? 0.7
      : state.stageId === 'tier1'
        ? 0.45
        : state.stageId === 'challengers'
          ? 0.2
          : 0;
  // Los rivales también progresan: la temporada se endurece sola.
  const seasonPressure = (state.turn / Math.max(1, state.maxTurns)) * 0.4;
  // Un poco más duros: si no laburás la semana, el “siempre gano” se corta.
  add('Nivel del rival', -(0.55 + stagePenalty + seasonPressure));

  const rivalHeat =
    state.activeThreads.find((t) => t.kind === 'rivalry')?.intensity ?? 0;
  if (rivalHeat >= 30) {
    // Heat 30→100 ≈ −0.18…−0.60; showdown (≥70) suma un poco más.
    add('Rivalidad', -((rivalHeat / 100) * 0.6 + (rivalHeat >= 70 ? 0.15 : 0)));
  } else if (state.relations.rival >= 55) {
    add('El rival te estudió', -0.3);
  }
  if (state.form < 40) add('Fuera de ritmo', -0.35);
  if (state.fatigue > 75) add('Cuerpo quemado', -0.4);

  const noise = (roll() - 0.5) * 1.6;
  add('Varianza del día', noise);

  const score = factors.reduce((sum, f) => sum + f.value, 0);
  const won = score >= 0.25;

  const kills = Math.max(0, Math.round(3 + score * 2 + roll() * 4));
  const deaths = Math.max(0, Math.round(won ? 1 + roll() * 3 : 3 + roll() * 4));
  const assists = Math.max(0, Math.round(4 + (state.stats.teamwork ?? 0) / 20 + roll() * 3));
  const mvp = won && kills + assists >= deaths * 2 && roll() > 0.45;

  if (won) highlights.push('Victoria en el scoreboard');
  else highlights.push('Derrota — review inevitable');
  if (mvp) highlights.push('MVP de la serie');

  const our = won ? 1 : 0;
  const their = won ? 0 : 1;
  const result: MatchResult = {
    won,
    kills,
    deaths,
    assists,
    mvp,
    opponent,
    scoreLine: `${our}–${their}`,
    highlights: highlights.slice(0, 4),
    factors: [...factors].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 6),
  };

  let stats = applyStatDelta(state.stats, {
    reputation: won ? (mvp ? 10 : 6) + perks.repEdge : -3,
    mentality: won ? 4 : -5,
    mechanics: mvp ? 3 : 1,
    teamwork: won ? 3 : -1,
  });

  const relations: Relations = {
    ...state.relations,
    coach: clampRel(state.relations.coach + (won ? 3 : -2)),
    duo: clampRel(state.relations.duo + (won ? 4 : -1)),
    rival: clampRel(state.relations.rival + (won ? 2 : 3)),
    manager: clampRel(state.relations.manager + (won && mvp ? 4 : won ? 2 : 0)),
  };

  const prize = won ? (mvp ? 55 : 35) : 8;
  let next: CareerState = {
    ...state,
    stats,
    relations,
    cash: state.cash + prize,
    form: clampRel(state.form + (won ? 5 + perks.winSurge : -3 + perks.lossCushion)),
    fatigue: clampRel(state.fatigue + 9 + age.matchFatigue),
    lastMatch: result,
    wins: state.wins + (won ? 1 : 0),
    losses: state.losses + (won ? 0 : 1),
    seasonWins: state.seasonWins + (won ? 1 : 0),
    seasonLosses: state.seasonLosses + (won ? 0 : 1),
    rngSeed: seed,
    lastNotice: won
      ? mvp
        ? `MVP vs ${opponent}. +$${prize}`
        : `Win vs ${opponent}. ${result.scoreLine} · +$${prize}`
      : `Loss vs ${opponent}. VOD duele. +$${prize}`,
    ticker: [
      won ? `W vs ${opponent}` : `L vs ${opponent}`,
      `+$${prize}`,
      `${result.kills}/${result.deaths}/${result.assists}`,
      ...result.highlights,
    ],
  };

  // Series on-role endurecen la identidad; MVP acelera.
  next = gainRoleMastery(next, won ? (mvp ? 7 : 4) : 2);

  return { result, state: next, seed };
}

function clampRel(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
