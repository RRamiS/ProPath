import { applyStatDelta, nextRng } from '../engine/createCareer';
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

export function buildMatchBeats(roleId: string): MatchBeat[] {
  return [
    {
      phase: 'draft',
      title: 'Draft room',
      body: 'Ban phase. El coach mira el clipboard. ¿Qué línea abrís?',
      choices: [
        { id: 'safe', label: 'Draft seguro / scaling', hint: 'Menos riesgo', momentum: 0 },
        { id: 'prio', label: 'Prio de early', hint: 'Presión de mapa', momentum: 1 },
        { id: 'flex', label: 'Flex raro para surprise', hint: 'Alto riesgo', momentum: 0 },
      ],
    },
    {
      phase: 'early',
      title: 'Early game',
      body:
        roleId === 'jungle'
          ? 'Pathing: ¿invadir, full clear o gank temprano?'
          : 'La oleada llega. ¿Cómo jugás los primeros 8 minutos?',
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

export function resolveMatch(
  state: CareerState,
  choices: string[],
  opponent: string
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

  let callsValue = 0;
  choices.forEach((cid, i) => {
    const beat = beats[i];
    const choice = beat?.choices.find((c) => c.id === cid);
    if (!choice) return;
    // Con 4 fases, si cada llamada pesa mucho el resto del juego no importa.
    callsValue += choice.momentum * 0.42;
    if (choice.formBonus) callsValue += choice.formBonus * 0.06;
    if (i === 0 && cid === 'prio') highlights.push('Early prio en draft');
    if (i === 1 && cid === 'playmake') highlights.push('First blood attempt');
    if (i === 2 && cid === 'focus') highlights.push('Foco limpio al carry');
    if (i === 2 && cid === 'steal') highlights.push('Play de objetivo');
    if (i === 3 && cid === 'baron') highlights.push('Baron robado bajo presión');
    if (i === 3 && cid === 'close') highlights.push('Cierre directo al nexo');
  });
  add('Tus llamadas', callsValue);

  const stagePenalty =
    state.stageId === 'worlds'
      ? 0.7
      : state.stageId === 'tier1'
        ? 0.45
        : state.stageId === 'challengers'
          ? 0.2
          : 0;
  // Los rivales también progresan: la temporada se endurece sola.
  const seasonPressure = (state.turn / Math.max(1, state.maxTurns)) * 0.6;
  add('Nivel del rival', -(0.25 + stagePenalty + seasonPressure));

  if (state.relations.rival >= 55) add('El rival te estudió', -0.3);
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
    reputation: won ? (mvp ? 10 : 6) : -3,
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

  const next: CareerState = {
    ...state,
    stats,
    relations,
    form: clampRel(state.form + (won ? 6 : -4)),
    fatigue: clampRel(state.fatigue + 12),
    lastMatch: result,
    wins: state.wins + (won ? 1 : 0),
    losses: state.losses + (won ? 0 : 1),
    rngSeed: seed,
    lastNotice: won
      ? mvp
        ? `MVP vs ${opponent}. El timeline explotó.`
        : `Win vs ${opponent}. ${result.scoreLine}`
      : `Loss vs ${opponent}. VOD duele.`,
    ticker: [
      won ? `W vs ${opponent}` : `L vs ${opponent}`,
      `${result.kills}/${result.deaths}/${result.assists}`,
      ...result.highlights,
    ],
  };

  return { result, state: next, seed };
}

function clampRel(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
