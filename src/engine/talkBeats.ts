/**
 * Diálogos de hub: un beat = apertura + 3 opciones con pros/contras.
 * Algunas opciones piden verbos (timing / hold / sort / tap) antes de resolver.
 */
import { applyStatDelta, nextRng } from './createCareer';
import type { InteractVerb } from './interact';
import { upsertThread } from './memory';
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
  hint: string;
  effect: ChoiceEffect;
  outcome: string;
  verb?: InteractVerb;
  /** Si el skill check falla. */
  failOutcome?: string;
  failEffect?: ChoiceEffect;
  sortItems?: string[];
}

export interface TalkBeat {
  id: string;
  kind: RelationKey;
  line: string;
  venues?: VenueId[];
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
  {
    id: 'duo_queue_plan',
    kind: 'duo',
    line: 'Duo: "¿Qué hacemos? Tengo una hora libre y cero paciencia."',
    weight: 12,
    choices: [
      {
        id: 'duo_rank',
        label: 'Rankeds juntos',
        hint: '+mecánicas, +dúo · requiere timing',
        verb: 'timing',
        effect: { stats: { mechanics: 3 }, relations: { duo: 4 } },
        outcome: 'Dos ranked. Una win, una pelea de chat. El dúo se ríe igual.',
        failOutcome: 'Int tilt en la primera. El dúo mutea el chat un rato.',
        failEffect: { stats: { mechanics: 1, mentality: -2 }, relations: { duo: 1 } },
      },
      {
        id: 'duo_vod',
        label: 'Mirar un VOD juntos',
        hint: '+visión, +dúo · ordená prioridades',
        verb: 'sort',
        sortItems: ['Wave', 'Vision', 'Ego', 'Next fight'],
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
        hint: '+reputación · ventana de upload',
        verb: 'tap',
        effect: { stats: { reputation: 4, money: 2 }, relations: { duo: 3, coach: -1 } },
        outcome: 'El clip explota. Marek manda un “hablamos” sin emoji.',
        failOutcome: 'El encode falla. Queda en drafts… por suerte.',
        failEffect: { stats: { reputation: 1 }, relations: { duo: 2 } },
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
  {
    id: 'duo_cafe_table',
    kind: 'duo',
    venues: ['cafe'],
    line: 'Duo empuja una silla: "Este es nuestro rincón. Hoy laburamos o hablamos?"',
    weight: 10,
    choices: [
      {
        id: 'duo_cafe_lab',
        label: 'Labear drafts acá',
        hint: '+visión · hold el foco',
        verb: 'hold',
        effect: { stats: { gameSense: 4 }, relations: { duo: 3 } },
        outcome: 'Dos comps en la servilleta. El barista ya ni pregunta.',
        failOutcome: 'Se distraen con el stream del TV. Poco avance.',
        failEffect: { stats: { gameSense: 1, mentality: -1 }, relations: { duo: 1 } },
      },
      {
        id: 'duo_cafe_vent',
        label: 'Ventear sin ranked',
        hint: '+mente, +dúo',
        effect: { stats: { mentality: 4 }, relations: { duo: 4 } },
        outcome: 'Salís más liviano. El grind puede esperar una hora.',
      },
      {
        id: 'duo_cafe_dare',
        label: '1v1 en el client del café',
        hint: 'Easter egg · timing o humillación',
        verb: 'timing',
        effect: { stats: { mechanics: 3, reputation: 1 }, relations: { duo: 2, rival: 1 } },
        outcome: 'Win limpia. El café aplaude en joda.',
        failOutcome: 'Te hacen first blood en mid… del café. Clip eterno.',
        failEffect: { stats: { mentality: -2, reputation: 1 }, relations: { duo: 3 } },
      },
    ],
  },

  {
    id: 'coach_review',
    kind: 'coach',
    line: 'Marek: "Tengo tres minutos. Decime qué querés escuchar."',
    weight: 12,
    choices: [
      {
        id: 'coach_honest',
        label: 'La verdad cruda',
        hint: '+visión · −mente · hold',
        verb: 'hold',
        effect: { stats: { gameSense: 4, mentality: -2 }, relations: { coach: 5 } },
        outcome: 'Te parte el VOD en seco. Duele. Después se entiende.',
        failOutcome: 'Cortás mirando el piso. Marek anota “no listo”.',
        failEffect: { stats: { mentality: -3 }, relations: { coach: 1 } },
      },
      {
        id: 'coach_plan',
        label: 'Un plan concreto',
        hint: '+teamplay · ordená el board',
        verb: 'sort',
        sortItems: ['Scrim', 'VOD', 'SoloQ', 'Descanso'],
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
        hint: '+visión grande · hold',
        verb: 'hold',
        effect: { stats: { gameSense: 5, mentality: -1 }, relations: { coach: 4 } },
        outcome: 'Ves el error que él nunca olvidó. Ahora tampoco vos.',
        failOutcome: 'Te dormís a los 4 minutos. Marek apaga sin hablar.',
        failEffect: { stats: { mentality: -2 }, relations: { coach: -1 } },
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

  {
    id: 'rival_measure',
    kind: 'rival',
    line: 'Rival: "Vi tu last. ¿Suerte o hands?"',
    weight: 11,
    choices: [
      {
        id: 'rival_banter',
        label: 'Banter limpio',
        hint: '+reputación, +rival · timing del chiste',
        verb: 'tap',
        effect: { stats: { reputation: 2, mentality: 1 }, relations: { rival: 4 } },
        outcome: 'Queda respeto. El chat del café anota el momento.',
        failOutcome: 'El chiste cae flat. Silencio de 3 segundos eternos.',
        failEffect: { stats: { mentality: -1 }, relations: { rival: 1 } },
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
        hint: '+mecánicas · timing',
        verb: 'timing',
        effect: { stats: { mechanics: 3, reputation: 1 }, relations: { rival: 5 } },
        outcome: 'Queda pactado. El timeline ya vibra.',
        failOutcome: 'Pedís customs y tu voz tiembla. El rival sonríe.',
        failEffect: { stats: { reputation: 1, mentality: -1 }, relations: { rival: 2 } },
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
        hint: '+mente · ventana de respuesta',
        verb: 'tap',
        effect: { stats: { mentality: 3, reputation: 2 }, relations: { rival: 3 } },
        outcome: '"Sí, era yo." El café aplaude en joda.',
        failOutcome: 'Tardás. El rival ya pasó a otra historia.',
        failEffect: { stats: { mentality: -1 }, relations: { rival: 1 } },
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
  {
    id: 'rival_heat_check',
    kind: 'rival',
    venues: ['cafe', 'arena', 'gym'],
    line: 'Rival: "Esto ya no es un chiste. Customs esta noche o admitís que tenés miedo."',
    weight: 6,
    choices: [
      {
        id: 'rival_heat_yes',
        label: 'Customs. Ahora.',
        hint: '+mecánicas · timing · escala rivalidad',
        verb: 'timing',
        effect: { stats: { mechanics: 4, reputation: 2 }, relations: { rival: 5 } },
        outcome: 'Customs. El hilo de rivalidad sube otro escalón.',
        failOutcome: 'Pedís timeout. El rival se ríe en tu cara.',
        failEffect: { stats: { mentality: -2, reputation: -1 }, relations: { rival: 2 } },
      },
      {
        id: 'rival_heat_coach',
        label: 'Que lo vea Marek',
        hint: '+coach · rival frío',
        effect: { relations: { coach: 3, rival: -2 }, stats: { mentality: 1 } },
        outcome: 'El coach corta. Rivalidad intacta, ego a salvo.',
      },
      {
        id: 'rival_heat_public',
        label: 'Responder en el café',
        hint: 'Easter egg · ventana de clapback',
        verb: 'tap',
        effect: { stats: { reputation: 3, mentality: -1 }, relations: { rival: 4 } },
        outcome: 'El café calla. Guerra pública.',
        failOutcome: 'Tu clapback sale flojo. Risas.',
        failEffect: { stats: { reputation: -2 }, relations: { rival: 1 } },
      },
    ],
  },
  {
    id: 'rival_cafe_stare',
    kind: 'rival',
    venues: ['cafe'],
    line: 'Rival está en la mesa de la ventana. Te mira como si ya hubiera scouteado tu runa.',
    weight: 8,
    choices: [
      {
        id: 'rival_sit',
        label: 'Sentarte enfrente',
        hint: '+rival · hold la mirada',
        verb: 'hold',
        effect: { stats: { mentality: 2, reputation: 1 }, relations: { rival: 4 } },
        outcome: 'Hablan poco. Pesan mucho. Sale respeto.',
        failOutcome: 'Apartás la vista. El rival anota mental.',
        failEffect: { stats: { mentality: -1 }, relations: { rival: -1 } },
      },
      {
        id: 'rival_ignore',
        label: 'Ignorarlo',
        hint: '+foco · frío',
        effect: { stats: { mentality: 1 }, relations: { rival: -2 } },
        outcome: 'Pedís café y mirás el board. Guerra silenciosa.',
      },
      {
        id: 'rival_buy',
        label: 'Invitarle el espresso',
        hint: 'Easter egg · −plata, +rival',
        effect: { stats: { money: -1, reputation: 2 }, relations: { rival: 5 } },
        outcome: 'Acepta. "En la serie no hay espresso."',
      },
    ],
  },

  {
    id: 'manager_pitch',
    kind: 'manager',
    line: 'Manager: "Tengo una marca mirando. No es plata loca, pero es plata."',
    weight: 10,
    choices: [
      {
        id: 'mgr_take',
        label: 'Aceptar el deal',
        hint: '+plata · ordená cláusulas',
        verb: 'sort',
        sortItems: ['Fee', 'Horas', 'Exclusividad', 'Veto coach'],
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
        hint: '+plata chica · timing',
        verb: 'timing',
        effect: { stats: { money: 3, reputation: 3 }, relations: { manager: 3, duo: 1 } },
        outcome: 'Un short, sin filmar el scrim. Todos respiran.',
        failOutcome: 'Pedís de más. El deal se enfría.',
        failEffect: { stats: { money: 1 }, relations: { manager: -1 } },
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
        hint: '−plata · +manager',
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
  {
    id: 'manager_cafe_brand',
    kind: 'manager',
    venues: ['cafe'],
    line: 'Manager: "La marca del café quiere un story. Acá. Ahora. ¿Sí o no?"',
    weight: 7,
    choices: [
      {
        id: 'mgr_story',
        label: 'Grabar el story',
        hint: '+plata · ventana de pose',
        verb: 'tap',
        effect: { stats: { money: 3, reputation: 2 }, relations: { manager: 3 } },
        outcome: 'Un story, un café gratis, un coach que frunce.',
        failOutcome: 'Sale movido. La marca pide retake mañana.',
        failEffect: { stats: { reputation: -1 }, relations: { manager: 1 } },
      },
      {
        id: 'mgr_later',
        label: 'Después del scrim',
        hint: '+coach · −manager',
        effect: { relations: { manager: -2, coach: 2 }, stats: { mentality: 1 } },
        outcome: 'Prioridad clara. El manager agenda “tal vez”.',
      },
      {
        id: 'mgr_duo_cameo',
        label: 'Meter al dúo en cámara',
        hint: '+dúo, +marca',
        effect: { stats: { reputation: 3, money: 2 }, relations: { duo: 3, manager: 2 } },
        outcome: 'Dos caras, más likes. El dúo te debe un favor.',
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

  const rivalHeat =
    state.activeThreads.find((t) => t.kind === 'rivalry')?.intensity ?? 0;

  const pool = BEATS.filter((b) => {
    if (b.kind !== kind) return false;
    if (b.venues && !b.venues.includes(state.venueId)) return false;
    if (b.id === 'rival_heat_check' && rivalHeat < 40) return false;
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
  choiceId: string,
  success = true
): CareerState {
  const choice = session.choices.find((c) => c.id === choiceId);
  if (!choice) return state;

  const effect = success
    ? choice.effect
    : (choice.failEffect ?? { stats: { mentality: -2 } });

  const raw = { ...(effect.stats ?? {}) };
  let cash = state.cash;
  if (typeof raw.money === 'number') {
    cash = Math.max(0, cash + Math.round(raw.money * 8));
    delete raw.money;
  }
  const stats = applyStatDelta(state.stats, raw);
  const relations = applyRelations(state.relations, effect.relations);

  let next: CareerState = {
    ...state,
    stats,
    relations,
    cash,
    flags: {
      ...state.flags,
      ...(effect.flags ?? {}),
      lastTalkBeat: session.beatId,
      lastTalkChoice: choiceId,
      lastTalkOk: success ? 1 : 0,
    },
    lastNotice: success
      ? choice.outcome
      : (choice.failOutcome ?? 'No salió como querías. Quedó roce.'),
  };

  // Hablar con el rival enciende / escala el hilo de rivalidad.
  if (session.kind === 'rival') {
    const delta = success ? 14 : 8;
    next = upsertThread(next, 'rivalry', ['rival'], delta, {
      lastTalkBeat: session.beatId,
    });
    const rival = next.npcStates.rival;
    next = {
      ...next,
      npcStates: {
        ...next.npcStates,
        rival: {
          ...rival,
          urgency: Math.min(100, rival.urgency + (success ? 18 : 10)),
          pendingAction: rival.pendingAction ?? 'claim',
        },
      },
      ticker: [
        success ? 'RIVALIDAD · el hilo sube' : 'RIVALIDAD · roce sin cierre',
        ...next.ticker,
      ].slice(0, 8),
    };
  }

  return next;
}
