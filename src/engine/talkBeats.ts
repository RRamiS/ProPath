/**
 * Diálogos de hub: un beat = apertura + 3 opciones con pros/contras.
 * Algunas opciones piden verbos (timing / react / sort / tap) antes de resolver.
 */
import { applyStatDelta, nextRng } from './createCareer';
import type { InteractVerb } from './interact';
import {
  pushMemory,
  recentArchetypes,
  talkMemoryCallback,
  upsertThread,
} from './memory';
import { RIVAL_POST_CUSTOMS_HEAT, ensureRivalryHeat } from './rivalry';
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
  /** Callback de memoria con ese NPC (si hubo charla/situación previa). */
  callback?: string;
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
        hint: '+visión · reacción',
        verb: 'react',
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
    id: 'coach_academy_board',
    kind: 'coach',
    venues: ['academy'],
    line: 'Marek señala la pizarra: "Antes del scrim, una decisión. ¿Qué priorizamos?"',
    weight: 11,
    choices: [
      {
        id: 'coach_ac_early',
        label: 'Early y visión',
        hint: '+visión · ordená',
        verb: 'sort',
        sortItems: ['Wards', 'Path', 'Prio', 'Dive'],
        effect: { stats: { gameSense: 4, teamwork: 2 }, relations: { coach: 4 } },
        outcome: 'Plan de early en el board. Cero poesía.',
      },
      {
        id: 'coach_ac_fight',
        label: 'Fight discipline',
        hint: '+team · reacción',
        verb: 'react',
        effect: { stats: { teamwork: 4, mentality: 1 }, relations: { coach: 3, duo: 2 } },
        outcome: 'Focus targets claros. El dúo asiente.',
        failOutcome: 'Te trabás en el call. Marek reescribe solo.',
        failEffect: { stats: { mentality: -1 }, relations: { coach: 1 } },
      },
      {
        id: 'coach_ac_you',
        label: 'Mi lane primero',
        hint: '+mecánicas · −coach',
        effect: { stats: { mechanics: 3 }, relations: { coach: -2 } },
        outcome: 'Pedís foco personal. Queda anotado.',
      },
    ],
  },
  {
    id: 'duo_academy_warmup',
    kind: 'duo',
    venues: ['academy'],
    line: 'Duo en la booth: "Warmup rápido o vamos frios al scrim?"',
    weight: 10,
    choices: [
      {
        id: 'duo_ac_warmup',
        label: 'Warmup de aim',
        hint: '+mecánicas · timing',
        verb: 'timing',
        effect: { stats: { mechanics: 3 }, relations: { duo: 3 } },
        outcome: 'Diez minutos. Manos calientes.',
        failOutcome: 'Tilt de warmup. Mejor ni haber tocado.',
        failEffect: { stats: { mentality: -2 }, relations: { duo: 1 } },
      },
      {
        id: 'duo_ac_sync',
        label: 'Sync de signals',
        hint: '+team · reacción',
        verb: 'react',
        effect: { stats: { teamwork: 4 }, relations: { duo: 4 } },
        outcome: 'Dos pings, un idioma. Listos.',
        failOutcome: 'Se pisan los calls. Ríen igual.',
        failEffect: { stats: { teamwork: 1, mentality: -1 }, relations: { duo: 2 } },
      },
      {
        id: 'duo_ac_chill',
        label: 'Agua y silencio',
        hint: '+mente · fatiga baja',
        effect: { stats: { mentality: 3 }, relations: { duo: 2 } },
        outcome: 'Respiran. El scrim puede esperar dos minutos.',
      },
    ],
  },
  {
    id: 'duo_gym_spot',
    kind: 'duo',
    venues: ['gym'],
    line: 'Duo te encuentra en el gym: "¿Lab de cuerpo o viniste a escapar del VOD?"',
    weight: 7,
    choices: [
      {
        id: 'duo_gym_together',
        label: 'Circuito juntos',
        hint: '+dúo · reacción',
        verb: 'react',
        effect: { stats: { mentality: 2 }, relations: { duo: 4 } },
        outcome: 'Sudor compartido. Química de verdad.',
        failOutcome: 'Competís de más. Queda chiste amargo.',
        failEffect: { stats: { mentality: -1 }, relations: { duo: 1 } },
      },
      {
        id: 'duo_gym_honest',
        label: 'Confesar escape',
        hint: '+mente · +dúo',
        effect: { stats: { mentality: 4 }, relations: { duo: 3 } },
        outcome: 'Lo dicen en voz baja. El VOD puede esperar.',
      },
      {
        id: 'duo_gym_race',
        label: 'Race amistosa',
        hint: '+mecánicas · timing',
        verb: 'timing',
        effect: { stats: { mechanics: 2, reputation: 1 }, relations: { duo: 2 } },
        outcome: 'Gana quien gana. Amistad intacta.',
        failOutcome: 'Perdés feo. El dúo te debe un café.',
        failEffect: { stats: { mentality: -1 }, relations: { duo: 3 } },
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
        hint: '+visión · −mente · reacción',
        verb: 'react',
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
        hint: '+visión grande · reacción',
        verb: 'react',
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
        outcome: 'Customs pactados. Cuando el heat suba, viene el cara a cara.',
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
        outcome: 'Customs. El hilo arde — falta el showdown en arena.',
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
    id: 'rival_gym_rack',
    kind: 'rival',
    venues: ['gym'],
    line: 'Rival en el rack de al lado: "¿Forma o ego? Acá se ve todo."',
    weight: 9,
    choices: [
      {
        id: 'rival_gym_spot',
        label: 'Pedirle spot',
        hint: '+rival · timing',
        verb: 'timing',
        effect: { stats: { mechanics: 2, mentality: 1 }, relations: { rival: 4 } },
        outcome: 'Rep limpia. Guerra de ego pausada un minuto.',
        failOutcome: 'Fallás el timing. El rival no dice nada. Peor.',
        failEffect: { stats: { mentality: -2 }, relations: { rival: 1 } },
      },
      {
        id: 'rival_gym_race',
        label: 'Race de acondicionamiento',
        hint: '+forma · reacción',
        verb: 'react',
        effect: { stats: { mechanics: 3 }, relations: { rival: 3 } },
        outcome: 'Sudor y respeto. El scoreboard mental queda 1–1.',
        failOutcome: 'Te deja atrás. Sonríe sin abrir la boca.',
        failEffect: { stats: { mentality: -1, reputation: 1 }, relations: { rival: 2 } },
      },
      {
        id: 'rival_gym_ignore',
        label: 'Auriculares full',
        hint: '+foco · frío',
        effect: { stats: { mentality: 2 }, relations: { rival: -2 } },
        outcome: 'Mute al mundo. El rival anota el snub.',
      },
    ],
  },
  {
    id: 'rival_arena_tunnel',
    kind: 'rival',
    venues: ['arena'],
    line: 'En el túnel de la arena, el rival pasa cerca: "Hoy no hay customs. Hay scoreboard."',
    weight: 8,
    choices: [
      {
        id: 'rival_arena_nod',
        label: 'Asentir y seguir',
        hint: '+mente · respeto',
        effect: { stats: { mentality: 3 }, relations: { rival: 2 } },
        outcome: 'Cero palabras. Máxima presión.',
      },
      {
        id: 'rival_arena_clap',
        label: 'Clapback corto',
        hint: '+rep · timing',
        verb: 'timing',
        effect: { stats: { reputation: 3, mentality: -1 }, relations: { rival: 4 } },
        outcome: 'Una línea. El staff mira el reloj.',
        failOutcome: 'Sale flojo. El rival ni se frena.',
        failEffect: { stats: { reputation: -1 }, relations: { rival: 1 } },
      },
      {
        id: 'rival_arena_coach',
        label: 'Buscar a Marek',
        hint: '+coach · −rival',
        effect: { relations: { coach: 3, rival: -2 }, stats: { mentality: 1 } },
        outcome: 'El coach te saca del túnel. Prioridad clara.',
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
        hint: '+rival · reacción',
        verb: 'react',
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
  {
    id: 'coach_arena_huddle',
    kind: 'coach',
    venues: ['arena'],
    line: 'Marek junta al roster en el túnel: "Sesenta segundos. ¿Qué priorizamos?"',
    weight: 11,
    choices: [
      {
        id: 'huddle_plan',
        label: 'Repasar el plan',
        hint: '+visión · ordená',
        verb: 'sort',
        sortItems: ['Early', 'Vision', 'Fight', 'Cierre'],
        effect: { stats: { gameSense: 4, teamwork: 2 }, relations: { coach: 4 } },
        outcome: 'Cuatro puntos. Cero poesía. Listos.',
      },
      {
        id: 'huddle_calm',
        label: 'Bajar el pulso',
        hint: '+mente · reacción',
        verb: 'react',
        effect: { stats: { mentality: 4 }, relations: { coach: 3, duo: 2 } },
        outcome: 'Respiran. El draft deja de pesar tanto.',
        failOutcome: 'El hush dura un segundo. El ruido vuelve.',
        failEffect: { stats: { mentality: 1 }, relations: { coach: 1 } },
      },
      {
        id: 'huddle_ego',
        label: 'Pedir foco en tu lane',
        hint: '+mecánicas · −coach',
        effect: { stats: { mechanics: 3 }, relations: { coach: -2 } },
        outcome: 'Pedís protagonismo. Queda anotado.',
      },
    ],
  },
  {
    id: 'manager_arena_press',
    kind: 'manager',
    venues: ['arena'],
    line: 'Manager: "Hay un micrófono de prensa. Diez segundos. ¿Salís o paso yo?"',
    weight: 9,
    choices: [
      {
        id: 'press_own',
        label: 'Salir al mic',
        hint: '+rep · ventana de frase',
        verb: 'tap',
        effect: { stats: { reputation: 4, mentality: 1 }, relations: { manager: 3 } },
        outcome: 'Una frase limpia. El clip viaja.',
        failOutcome: 'Tartamudeás. Sola rescata el corte.',
        failEffect: { stats: { reputation: -1, mentality: -2 }, relations: { manager: 1 } },
      },
      {
        id: 'press_pass',
        label: 'Que hable Sola',
        hint: '+manager · +foco',
        effect: { stats: { mentality: 2 }, relations: { manager: 4, coach: 1 } },
        outcome: 'Vos al booth. Ella al mic. Bien repartido.',
      },
      {
        id: 'press_team',
        label: 'Meter al dúo',
        hint: '+dúo · +rep',
        effect: { stats: { reputation: 2, teamwork: 2 }, relations: { duo: 3, manager: 2 } },
        outcome: 'Dos caras, menos presión. El staff agradece.',
      },
    ],
  },
  {
    id: 'manager_home_call',
    kind: 'manager',
    venues: ['home'],
    line: 'Manager llama a las 23h: "Marca chica, plata chica, deadline ahora. ¿Sí?"',
    weight: 8,
    choices: [
      {
        id: 'home_deal',
        label: 'Aceptar el deal',
        hint: '+plata · ordená cláusulas',
        verb: 'sort',
        sortItems: ['Fee', 'Horas', 'Deadline', 'Veto coach'],
        effect: { stats: { money: 4, reputation: 2 }, relations: { manager: 4 }, fatigue: 2 },
        outcome: 'Firmás desde la cama. El coach va a fruncir mañana.',
      },
      {
        id: 'home_sleep',
        label: 'Mañana hablamos',
        hint: '+mente · −manager',
        effect: { stats: { mentality: 3 }, relations: { manager: -2 }, fatigue: -4 },
        outcome: 'Cortás. El sueño gana. El deal espera… o no.',
      },
      {
        id: 'home_half',
        label: 'Un short, nada más',
        hint: '+plata chica · timing',
        verb: 'timing',
        effect: { stats: { money: 2, reputation: 2 }, relations: { manager: 2 } },
        outcome: 'Un clip. Sin filmar el scrim. Todos respiran.',
        failOutcome: 'Pedís de más a las 23h. El deal se enfría.',
        failEffect: { stats: { money: 0 }, relations: { manager: -1 } },
      },
    ],
  },
  {
    id: 'duo_home_setup',
    kind: 'duo',
    venues: ['home'],
    line: 'Duo en tu pieza: "Tu cable management es un crime. ¿Laburamos el setup o ranked?"',
    weight: 9,
    choices: [
      {
        id: 'duo_cable',
        label: 'Ordenar cables',
        hint: '+mente · ordená',
        verb: 'sort',
        sortItems: ['USB', 'HDMI', 'Audio', 'Power'],
        effect: { stats: { mentality: 3 }, relations: { duo: 4 } },
        outcome: 'Setup limpio. El dúo te respeta más por eso.',
      },
      {
        id: 'duo_dual',
        label: 'Probar dual PC',
        hint: '+mecánicas · timing',
        verb: 'timing',
        effect: { stats: { mechanics: 3, teamwork: 1 }, relations: { duo: 3 } },
        outcome: 'Dos pantallas, una amistad. Vale la pena.',
        failOutcome: 'Driver crash. Ríen igual. Cero progreso.',
        failEffect: { stats: { mentality: -1 }, relations: { duo: 2 } },
      },
      {
        id: 'duo_skip_setup',
        label: 'Directo a ranked',
        hint: '+mecánicas · cables siguen',
        effect: { stats: { mechanics: 2 }, relations: { duo: 2 } },
        outcome: 'Ignoran el nido de cables. Prioridades claras.',
      },
    ],
  },
  {
    id: 'rival_academy_booth',
    kind: 'rival',
    venues: ['academy'],
    line: 'Rival te cruza en el pasillo de booths: "Bonito scrim block. ¿Customs después o miedo?"',
    weight: 9,
    choices: [
      {
        id: 'booth_banter',
        label: 'Banter limpio',
        hint: '+rival · reacción',
        verb: 'react',
        effect: { stats: { mentality: 2, reputation: 1 }, relations: { rival: 4 } },
        outcome: 'Una línea. Respeto de pasillo.',
        failOutcome: 'Se te traba. El rival sigue caminando.',
        failEffect: { stats: { mentality: -1 }, relations: { rival: 1 } },
      },
      {
        id: 'booth_customs',
        label: 'Customs esta noche',
        hint: '+mecánicas · timing · escala',
        verb: 'timing',
        effect: { stats: { mechanics: 3, reputation: 2 }, relations: { rival: 5 } },
        outcome: 'Queda pactado. El hilo de rivalidad sube.',
        failOutcome: 'La voz tiembla. El rival sonríe igual.',
        failEffect: { stats: { reputation: 1, mentality: -1 }, relations: { rival: 2 } },
      },
      {
        id: 'booth_walk',
        label: 'Seguir de largo',
        hint: '+foco · frío',
        effect: { stats: { mentality: 2 }, relations: { rival: -2, coach: 1 } },
        outcome: 'Ni una mirada. Guerra larga.',
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
  const lastBeat =
    typeof state.flags.lastTalkBeat === 'string' ? state.flags.lastTalkBeat : '';
  const recent = recentArchetypes(state, 8);

  const pool = BEATS.filter((b) => {
    if (b.kind !== kind) return false;
    if (b.venues && !b.venues.includes(state.venueId)) return false;
    if (b.id === 'rival_heat_check' && rivalHeat < 40) return false;
    return true;
  });

  // Evitar el mismo beat seguido si hay alternativa.
  let candidates = pool.filter((b) => b.id !== lastBeat);
  if (candidates.length === 0) candidates = pool;
  const fresh = candidates.filter((b) => !recent.has(b.id));
  const pickFrom = fresh.length > 0 ? fresh : candidates;

  const weighted = pickFrom.flatMap((b) => {
    let mult = b.egg ? 0.35 : 1;
    if (b.id === lastBeat) mult *= 0.05;
    else if (recent.has(b.id)) mult *= 0.18;
    const w = Math.max(1, Math.round((b.weight ?? 10) * mult));
    return Array.from({ length: w }, () => b);
  });
  const beat = weighted[Math.floor(roll() * weighted.length)] ?? pickFrom[0]!;
  const callback = talkMemoryCallback(state, kind) ?? undefined;

  return {
    seed,
    session: {
      kind,
      beatId: beat.id,
      line: beat.line.replace(/Marek/g, state.roster.coach.name),
      choices: beat.choices,
      callback,
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

  const outcome = success
    ? choice.outcome
    : (choice.failOutcome ?? 'No salió como querías. Quedó roce.');

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
      lastTalkKind: session.kind,
    },
    lastNotice: outcome,
  };

  next = pushMemory(next, {
    archetypeId: session.beatId,
    instanceId: `talk_${session.beatId}_${state.turn}`,
    actors: [session.kind],
    choiceId,
    turn: state.turn,
    stage: state.stageId,
    outcome,
    intensity: success ? 40 : 22,
    venueId: state.venueId,
  });

  // Hablar con el rival enciende / escala el hilo de rivalidad.
  if (session.kind === 'rival') {
    const delta = success ? 14 : 8;
    const acceptedCustoms =
      success &&
      (choiceId === 'rival_challenge' ||
        choiceId === 'rival_heat_yes' ||
        choiceId === 'booth_customs');
    next = upsertThread(next, 'rivalry', ['rival'], delta, {
      lastTalkBeat: session.beatId,
      ...(acceptedCustoms ? { customsAccepted: 1 } : {}),
    });
    if (acceptedCustoms) {
      next = ensureRivalryHeat(next, RIVAL_POST_CUSTOMS_HEAT);
    }
    const rival = next.npcStates.rival;
    next = {
      ...next,
      flags: acceptedCustoms
        ? { ...next.flags, customsAccepted: 1 }
        : next.flags,
      npcStates: {
        ...next.npcStates,
        rival: {
          ...rival,
          urgency: Math.min(100, rival.urgency + (success ? 18 : 10)),
          pendingAction: rival.pendingAction ?? 'claim',
        },
      },
      ticker: [
        acceptedCustoms
          ? 'CUSTOMS · pactados con el rival'
          : success
            ? 'RIVALIDAD · el hilo sube'
            : 'RIVALIDAD · roce sin cierre',
        ...next.ticker,
      ].slice(0, 8),
    };
  }

  return next;
}
