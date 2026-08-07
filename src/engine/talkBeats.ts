/**
 * Diálogos de hub: un beat = apertura + 3 opciones con pros/contras.
 *
 * v1: elegir con tradeoffs visibles (ChoiceBoard + EffectChips).
 * v2 (después): por opción, verbos interactivos (timing / sort / hold)
 * en vez de solo tap — sin reescribir este shape.
 */
import { applyStatDelta, nextRng } from './createCareer';
import type {
  CareerState,
  ChoiceEffect,
  RelationKey,
  VenueId,
} from './types';
import { applyRelations } from './week';

export interface TalkChoice {
  id: string;
  label: string;
  /** Pros / contras en una línea legible. */
  hint: string;
  effect: ChoiceEffect;
  outcome: string;
}

export interface TalkBeat {
  id: string;
  kind: RelationKey;
  line: string;
  venues?: VenueId[];
  /** Easter egg: aparece raro. */
  egg?: boolean;
  weight?: number;
  choices: TalkChoice[];
}

export interface TalkSession {
  kind: RelationKey;
  beatId: string;
  line: string;
  choices: TalkChoice[];
}

const BEATS: TalkBeat[] = [
  // —— Duo ——
  {
    id: 'duo_queue_plan',
    kind: 'duo',
    line: 'Duo: "¿Qué hacemos? Tengo una hora libre y cero paciencia."',
    weight: 12,
    choices: [
      {
        id: 'duo_rank',
        label: 'Rankeds juntos',
        hint: '+mecánicas, +dúo · +fatiga',
        effect: { stats: { mechanics: 3 }, relations: { duo: 4 } },
        outcome: 'Dos ranked. Una win, una pelea de chat. El dúo se ríe igual.',
      },
      {
        id: 'duo_vod',
        label: 'Mirar un VOD juntos',
        hint: '+visión, +dúo · menos ego',
        effect: { stats: { gameSense: 3, mentality: 1 }, relations: { duo: 3 } },
        outcome: 'Pausan el clip tres veces. Sale un call nuevo para la serie.',
      },
      {
        id: 'duo_coffee_roast',
        label: 'Roastearse sin filtro',
        hint: '+mente, +dúo · −reputación chica',
        effect: { stats: { mentality: 2, reputation: -1 }, relations: { duo: 5 } },
        outcome: 'Se ríen hasta que duele la panza. El group chat vibra.',
      },
    ],
  },
  {
    id: 'duo_secret_clip',
    kind: 'duo',
    line: 'Duo baja la voz: "Guardé un clip tuyo que nadie vio. ¿Lo subo?"',
    egg: true,
    weight: 3,
    choices: [
      {
        id: 'duo_post',
        label: 'Subilo',
        hint: '+reputación, +plata vibe · el coach frunce',
        effect: { stats: { reputation: 4, money: 2 }, relations: { duo: 3, coach: -1 } },
        outcome: 'El clip explota. Marek manda un “hablamos” sin emoji.',
      },
      {
        id: 'duo_keep',
        label: 'Guardalo de souvenir',
        hint: '+dúo, +mente · cero hype',
        effect: { stats: { mentality: 3 }, relations: { duo: 4 } },
        outcome: 'Queda entre ustedes. Vale más que un highlight público.',
      },
      {
        id: 'duo_trade',
        label: 'Solo si me das el tuyo',
        hint: '+dúo fuerte · −un poco de ego',
        effect: { stats: { mentality: -1, reputation: 2 }, relations: { duo: 6 } },
        outcome: 'Intercambio de vergüenzas. Amistad nivel season finals.',
      },
    ],
  },

  // —— Coach ——
  {
    id: 'coach_review',
    kind: 'coach',
    line: 'Marek: "Tengo tres minutos. Decime qué querés escuchar."',
    weight: 12,
    choices: [
      {
        id: 'coach_honest',
        label: 'La verdad cruda',
        hint: '+visión · −mente, +respeto coach',
        effect: { stats: { gameSense: 4, mentality: -2 }, relations: { coach: 5 } },
        outcome: 'Te parte el VOD en seco. Duele. Después se entiende.',
      },
      {
        id: 'coach_plan',
        label: 'Un plan concreto',
        hint: '+teamplay, +coach · sin drama',
        effect: { stats: { teamwork: 3, gameSense: 2 }, relations: { coach: 4 } },
        outcome: 'Tres puntos en el board. Cero poesía. Laburo.',
      },
      {
        id: 'coach_pushback',
        label: 'Discutir el call',
        hint: '+mente · −coach',
        effect: { stats: { mentality: 2 }, relations: { coach: -3 } },
        outcome: 'Queda roce. Marek anota algo y no te lo muestra.',
      },
    ],
  },
  {
    id: 'coach_old_patch',
    kind: 'coach',
    line: 'Marek saca un USB viejo: "Esto es del split donde casi nos echan. ¿Lo miramos?"',
    egg: true,
    weight: 2,
    choices: [
      {
        id: 'coach_watch',
        label: 'Dale, ponelo',
        hint: '+visión grande · +fatiga mental',
        effect: { stats: { gameSense: 5, mentality: -1 }, relations: { coach: 4 } },
        outcome: 'Ves el error que él nunca olvidó. Ahora tampoco vos.',
      },
      {
        id: 'coach_skip',
        label: 'Prefiero el presente',
        hint: '+mente · coach neutro',
        effect: { stats: { mentality: 2 }, relations: { coach: 1 } },
        outcome: 'Guarda el USB. "Cuando estés listo."',
      },
      {
        id: 'coach_ask_name',
        label: '¿Quién era el mid?',
        hint: 'Easter egg · +reputación interna',
        effect: { stats: { reputation: 2, gameSense: 1 }, relations: { coach: 3 } },
        outcome: 'Marek sonríe raro: "Un pibe que se parecía a vos."',
      },
    ],
  },

  // —— Rival ——
  {
    id: 'rival_measure',
    kind: 'rival',
    line: 'Rival: "Vi tu last. ¿Suerte o hands?"',
    weight: 11,
    choices: [
      {
        id: 'rival_banter',
        label: 'Banter limpio',
        hint: '+reputación, +rival · cero tilt',
        effect: { stats: { reputation: 2, mentality: 1 }, relations: { rival: 4 } },
        outcome: 'Queda respeto. El chat del café anota el momento.',
      },
      {
        id: 'rival_ice',
        label: 'Cortar en seco',
        hint: '+foco · −rival',
        effect: { stats: { mentality: 2 }, relations: { rival: -3 } },
        outcome: 'Silencio. Victoria chica. Guerra larga.',
      },
      {
        id: 'rival_challenge',
        label: 'Customs esta noche',
        hint: '+mecánicas, +rival · +presión',
        effect: { stats: { mechanics: 3, reputation: 1 }, relations: { rival: 5 } },
        outcome: 'Queda pactado. El timeline ya vibra.',
      },
    ],
  },
  {
    id: 'rival_old_nick',
    kind: 'rival',
    line: 'Rival suelta tu nick viejo de SoloQ. El que juraste enterrar.',
    egg: true,
    weight: 2,
    choices: [
      {
        id: 'rival_own',
        label: 'Ownarlo',
        hint: '+mente, +reputación · el rival se ríe',
        effect: { stats: { mentality: 3, reputation: 2 }, relations: { rival: 3 } },
        outcome: '"Sí, era yo." El café aplaude en joda.',
      },
      {
        id: 'rival_deny',
        label: 'Negar hasta morir',
        hint: '−mente · −rival',
        effect: { stats: { mentality: -2 }, relations: { rival: -2 } },
        outcome: 'Nadie te cree. El clip mental queda igual.',
      },
      {
        id: 'rival_trade_secret',
        label: 'Te digo el tuyo',
        hint: '+rival fuerte · secret mutual',
        effect: { stats: { reputation: 1 }, relations: { rival: 6 }, flags: { nickTruce: 1 } },
        outcome: 'Tregua de nicks. Guerra de skills, paz de past.',
      },
    ],
  },

  // —— Manager ——
  {
    id: 'manager_pitch',
    kind: 'manager',
    line: 'Manager: "Tengo una marca mirando. No es plata loca, pero es plata."',
    weight: 10,
    choices: [
      {
        id: 'mgr_take',
        label: 'Aceptar el deal',
        hint: '+plata, +manager · −teamplay',
        effect: { stats: { money: 5, reputation: 2, teamwork: -2 }, relations: { manager: 4 } },
        outcome: 'Firmás con el dedo. El coach mira el reloj.',
      },
      {
        id: 'mgr_pass',
        label: 'Pasar esta',
        hint: '+foco team · manager frío',
        effect: { stats: { mentality: 2 }, relations: { manager: -2, coach: 2 } },
        outcome: 'Priorizás el split. El manager anota “después”.',
      },
      {
        id: 'mgr_negotiate',
        label: 'Negociar clip corto',
        hint: '+plata chica, +reputación · equilibrio',
        effect: { stats: { money: 3, reputation: 3 }, relations: { manager: 3, duo: 1 } },
        outcome: 'Un short, sin filmar el scrim. Todos respiran.',
      },
    ],
  },
  {
    id: 'manager_receipt',
    kind: 'manager',
    line: 'Manager te muestra un ticket: "Café del draft night. ¿Lo pusiste vos?"',
    egg: true,
    weight: 2,
    venues: ['cafe', 'home'],
    choices: [
      {
        id: 'mgr_pay',
        label: 'Lo pago yo',
        hint: '−plata · +manager, +respeto',
        effect: { stats: { money: -2, mentality: 1 }, relations: { manager: 4 } },
        outcome: 'Pagás. Nunca fue tu café. Quedó como gesto.',
      },
      {
        id: 'mgr_coach',
        label: 'Fue Marek',
        hint: 'Easter egg · coach debe un favor',
        effect: { relations: { coach: -1, manager: 2 }, flags: { marekOwesCoffee: 1 } },
        outcome: 'Marek niega con la cara. El manager sonríe: ya sabe.',
      },
      {
        id: 'mgr_dodge',
        label: 'Cambiar de tema',
        hint: 'Neutro · cero drama',
        effect: { stats: { mentality: 1 } },
        outcome: 'El ticket vuelve a la billetera. Misterio eterno.',
      },
    ],
  },
];

export function pickTalkBeat(
  state: CareerState,
  kind: RelationKey
): { session: TalkSession; seed: number } {
  let seed = state.rngSeed;
  const roll = () => {
    const r = nextRng(seed);
    seed = r.seed;
    return r.value;
  };

  const pool = BEATS.filter((b) => {
    if (b.kind !== kind) return false;
    if (b.venues && !b.venues.includes(state.venueId)) return false;
    return true;
  });

  const weighted = pool.flatMap((b) => {
    const w = Math.max(1, Math.round((b.weight ?? 10) * (b.egg ? 0.35 : 1)));
    return Array.from({ length: w }, () => b);
  });
  const beat = weighted[Math.floor(roll() * weighted.length)] ?? pool[0]!;

  return {
    seed,
    session: {
      kind,
      beatId: beat.id,
      line: beat.line.replace(/Marek/g, state.roster.coach.name),
      choices: beat.choices,
    },
  };
}

export function applyTalkChoice(
  state: CareerState,
  session: TalkSession,
  choiceId: string
): CareerState {
  const choice = session.choices.find((c) => c.id === choiceId);
  if (!choice) return state;

  const raw = { ...(choice.effect.stats ?? {}) };
  let cash = state.cash;
  if (typeof raw.money === 'number') {
    cash = Math.max(0, cash + Math.round(raw.money * 8));
    delete raw.money;
  }
  const stats = applyStatDelta(state.stats, raw);
  const relations = applyRelations(state.relations, choice.effect.relations);

  return {
    ...state,
    stats,
    relations,
    cash,
    flags: {
      ...state.flags,
      ...(choice.effect.flags ?? {}),
      lastTalkBeat: session.beatId,
      lastTalkChoice: choiceId,
    },
    lastNotice: choice.outcome,
  };
}
