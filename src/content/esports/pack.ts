import type { ContentPack, GameEvent } from '../../engine/types';
import { hubEvents } from './hubEvents';
import { regionalEvents } from './regionalEvents';

const events: GameEvent[] = [
  {
    id: 'first_grind',
    title: 'La primera temporada seria',
    body: 'Decidís tratar ranked como un laburo. ¿Cómo estructurás tus días?',
    stages: ['soloq'],
    weight: 10,
    choices: [
      {
        id: 'vod_review',
        label: 'VOD review todos los días',
        hint: '+game sense · −plata',
        effect: { stats: { gameSense: 8, mechanics: 3, money: -4, mentality: -2 } },
      },
      {
        id: 'raw_hours',
        label: 'Pumpear horas a lo loco',
        hint: '+mecánicas · riesgo de tilt',
        effect: { stats: { mechanics: 10, mentality: -6, gameSense: 2 } },
      },
      {
        id: 'duo_content',
        label: 'Duos + contenido en redes',
        hint: '+reputación y plata',
        effect: { stats: { reputation: 10, money: 6, mechanics: 2, teamwork: 3 } },
      },
    ],
  },
  {
    id: 'rank_anxiety',
    title: 'Ansiedad de elo',
    body: 'Estás a un win de un rank que te obsesiona. El chat te come la cabeza.',
    stages: ['soloq'],
    weight: 7,
    choices: [
      {
        id: 'take_break',
        label: 'Cerrar y caminar 20 minutos',
        effect: { stats: { mentality: 8, mechanics: -1 } },
      },
      {
        id: 'one_more',
        label: 'Una más… y otra',
        effect: { stats: { mechanics: 4, mentality: -10, reputation: -2 } },
      },
      {
        id: 'smurf_warmup',
        label: 'Warmup en otra cuenta',
        effect: { stats: { mechanics: 5, gameSense: 2, mentality: 2 } },
      },
    ],
  },
  {
    id: 'role_otp',
    title: 'Main o flex',
    body: 'Tu rol está saturado en el elo. Un coach te sugiere flexear para subir más rápido.',
    stages: ['soloq', 'academy'],
    weight: 6,
    choices: [
      {
        id: 'otp_pride',
        label: 'OTP: perfeccionar tu rol',
        effect: { stats: { mechanics: 9, gameSense: 4, teamwork: -3 } },
      },
      {
        id: 'flex_climb',
        label: 'Flexear para ganar LP',
        effect: { stats: { teamwork: 8, reputation: 4, mechanics: 2 } },
      },
    ],
  },
  {
    id: 'latam_lan',
    title: 'LAN regional',
    body: 'Hay un torneo presencial. El viaje cuesta, pero los scouts miran.',
    stages: ['soloq', 'academy'],
    nationTags: ['latam', 'hungry-scene', 'big-audience'],
    weight: 8,
    choices: [
      {
        id: 'go_lan',
        label: 'Ir aunque te quedes seco',
        effect: { stats: { reputation: 12, money: -12, mentality: 5, teamwork: 4 } },
      },
      {
        id: 'skip_lan',
        label: 'Saltarlo y farmear elo',
        effect: { stats: { mechanics: 5, reputation: -3, money: 2 } },
      },
    ],
  },
  {
    id: 'internet_outage',
    title: 'El wifi traiciona',
    body: 'Se te cae la conexión en una ranked decisiva. Perdés LP y la cabeza.',
    stages: ['soloq'],
    nationTags: ['latam', 'hungry-scene'],
    weight: 5,
    choices: [
      {
        id: 'invest_net',
        label: 'Invertir en mejor conexión',
        effect: { stats: { money: -10, mentality: 4, mechanics: 3 }, flags: { goodNet: true } },
      },
      {
        id: 'rage_queue',
        label: 'Rage queue apenas vuelve',
        effect: { stats: { mentality: -8, mechanics: -2, reputation: -3 } },
      },
    ],
  },
  {
    id: 'kr_bootcamp',
    title: 'Invitación a bootcamp',
    body: 'Te ofrecen un mes de bootcamp de alto nivel. El ritmo es inhumano.',
    stages: ['soloq', 'academy', 'challengers'],
    nationTags: ['kr', 'elite-training', 'eu', 'na'],
    weight: 6,
    choices: [
      {
        id: 'accept_bootcamp',
        label: 'Aceptar y sobrevivir',
        effect: { stats: { mechanics: 12, gameSense: 10, mentality: -8, money: -6 } },
      },
      {
        id: 'decline_bootcamp',
        label: 'Declinar: priorizar salud',
        effect: { stats: { mentality: 8, reputation: -2 } },
      },
    ],
  },
  {
    id: 'toxic_team',
    title: 'Teammate tóxico',
    body: 'En un tryout hay un jugador que tira la partida y te culpa en voz.',
    stages: ['soloq', 'academy'],
    weight: 7,
    choices: [
      {
        id: 'mute_focus',
        label: 'Mute y focus en tu rol',
        effect: { stats: { mentality: 6, teamwork: -2, mechanics: 4 } },
      },
      {
        id: 'shotcall',
        label: 'Tomar el call y ordenar el caos',
        effect: { stats: { teamwork: 10, mentality: 3, reputation: 5 } },
      },
      {
        id: 'flame_back',
        label: 'Devolver el flame',
        effect: { stats: { mentality: -8, reputation: -10, teamwork: -5 } },
      },
    ],
  },
  {
    id: 'academy_contract',
    title: 'Oferta Academy',
    body: 'Una org te ofrece contrato academy: sueldo bajo, team house y fixtures semanales.',
    stages: ['soloq', 'academy'],
    weight: 8,
    choices: [
      {
        id: 'sign_academy',
        label: 'Firmar',
        effect: {
          stats: { money: 8, teamwork: 8, reputation: 10, mentality: 4 },
          setStage: 'academy',
        },
      },
      {
        id: 'keep_solo',
        label: 'Seguir free agent',
        effect: { stats: { mechanics: 6, reputation: 2, money: -4 } },
      },
    ],
  },
  {
    id: 'meta_shift',
    title: 'Cambio de meta',
    body: 'El parche destroza tu champion pool. Tenés dos semanas para adaptarte.',
    stages: ['soloq', 'academy', 'challengers', 'tier1'],
    weight: 8,
    choices: [
      {
        id: 'one_trick_flex',
        label: 'Aprender 3 picks nuevos YA',
        effect: { stats: { gameSense: 8, mechanics: 5, mentality: -4 } },
      },
      {
        id: 'force_old',
        label: 'Forzar tu viejo pool',
        effect: { stats: { mechanics: 2, reputation: -5, mentality: -3 } },
      },
    ],
  },
  {
    id: 'visa_wall',
    title: 'Muro de visas',
    body: 'Una org de otra región te prueba. Para firmar necesitás papeles.',
    stages: ['academy', 'challengers', 'tier1'],
    nationTags: ['visa-hard'],
    weight: 9,
    choices: [
      {
        id: 'wait_visa',
        label: 'Esperar el trámite (meses)',
        effect: { stats: { mentality: -5, reputation: 5 }, flags: { visaPending: true } },
      },
      {
        id: 'local_org',
        label: 'Quedarte en una org local sólida',
        effect: { stats: { money: 8, teamwork: 6, reputation: 4 } },
      },
      {
        id: 'online_only',
        label: 'Seguir online y forzar showmatch',
        effect: { stats: { reputation: 8, mechanics: 4, money: -3 } },
      },
    ],
  },
  {
    id: 'sponsor_offer',
    title: 'Primer sponsor',
    body: 'Una marca de periféricos quiere que uses su setup en streams. El contrato es mediocre.',
    stages: ['academy', 'challengers'],
    nationTags: ['creator-economy', 'big-audience', 'na', 'br'],
    weight: 6,
    choices: [
      {
        id: 'take_sponsor',
        label: 'Firmar: plata ahora',
        effect: { stats: { money: 15, reputation: 5 } },
      },
      {
        id: 'wait_better',
        label: 'Esperar una marca más grande',
        effect: { stats: { reputation: 3, money: -2 }, flags: { picky_brand: true } },
      },
    ],
  },
  {
    id: 'team_house',
    title: 'Vida en la team house',
    body: 'Compartís cocina, horarios y tilt con cuatro personas más. La convivencia pesa.',
    stages: ['academy', 'challengers'],
    weight: 7,
    choices: [
      {
        id: 'social_glue',
        label: 'Ser el pegamento del equipo',
        effect: { stats: { teamwork: 10, mentality: 4, mechanics: -2 } },
      },
      {
        id: 'solo_room',
        label: 'Aislarte y farmear solo',
        effect: { stats: { mechanics: 7, teamwork: -6, mentality: -2 } },
      },
      {
        id: 'mediate',
        label: 'Mediar conflictos del roster',
        effect: { stats: { teamwork: 8, reputation: 6, mentality: -3 } },
      },
    ],
  },
  {
    id: 'scrim_block',
    title: 'Bloque de scrims',
    body: 'Tres días de scrims contra un equipo que os destroza. El coach pide review nocturna.',
    stages: ['academy', 'challengers', 'tier1'],
    weight: 8,
    choices: [
      {
        id: 'grind_review',
        label: 'Review hasta las 3 AM',
        effect: { stats: { gameSense: 10, teamwork: 5, mentality: -7 } },
      },
      {
        id: 'sleep_prio',
        label: 'Dormir y reset mañana',
        effect: { stats: { mentality: 9, mechanics: 2, gameSense: 2 } },
      },
    ],
  },
  {
    id: 'coach_conflict',
    title: 'Choque con el coach',
    body: 'El coach quiere un estilo pasivo. Vos sentís que hay que forzar early.',
    stages: ['academy', 'challengers', 'tier1'],
    weight: 6,
    choices: [
      {
        id: 'follow_system',
        label: 'Seguir el sistema',
        effect: { stats: { teamwork: 8, reputation: 3, mechanics: -2 } },
      },
      {
        id: 'argue_draft',
        label: 'Discutir el draft en voz alta',
        effect: { stats: { gameSense: 6, reputation: -4, teamwork: -4, mentality: -3 } },
      },
      {
        id: 'prove_ingame',
        label: 'Callar y demostrar in-game',
        effect: { stats: { mechanics: 8, mentality: 4, reputation: 5 } },
      },
    ],
  },
  {
    id: 'sub_threat',
    title: 'El sub te respira la nuca',
    body: 'Traen un sub más joven que farmea tu rol en scrims. El staff mira el clipboard.',
    stages: ['academy', 'challengers', 'tier1'],
    weight: 7,
    choices: [
      {
        id: 'raise_level',
        label: 'Subir el nivel y callar bocas',
        effect: { stats: { mechanics: 9, mentality: -4, reputation: 6 } },
      },
      {
        id: 'help_sub',
        label: 'Mentorear al sub',
        effect: { stats: { teamwork: 9, reputation: 7, mentality: 3 } },
      },
      {
        id: 'politics',
        label: 'Hablar con management',
        effect: { stats: { reputation: 4, teamwork: -5, money: 3 } },
      },
    ],
  },
  {
    id: 'playoff_run',
    title: 'Playoffs',
    body: 'Serie al mejor de cinco. El rival es favorito. El draft de mapa 1 es clave.',
    stages: ['challengers', 'tier1', 'worlds'],
    weight: 9,
    choices: [
      {
        id: 'safe_draft',
        label: 'Draft seguro, jugar el plan',
        effect: { stats: { teamwork: 8, gameSense: 6, reputation: 5 } },
      },
      {
        id: 'cheese_draft',
        label: 'Cheese agresivo',
        effect: { stats: { mechanics: 6, reputation: 8, mentality: -4, teamwork: -3 } },
      },
      {
        id: 'trust_shotcaller',
        label: 'Confiar 100% en el shotcaller',
        effect: { stats: { teamwork: 10, mentality: 5, gameSense: 3 } },
      },
    ],
  },
  {
    id: 'contract_talks',
    title: 'Renovación de contrato',
    body: 'Tu agente pone un número alto. La org ofrece menos pero más estabilidad.',
    stages: ['challengers', 'tier1'],
    weight: 6,
    choices: [
      {
        id: 'take_stable',
        label: 'Aceptar estabilidad',
        effect: { stats: { money: 10, mentality: 6, reputation: 2 } },
      },
      {
        id: 'hardball',
        label: 'Hardball: más plata o me voy',
        effect: { stats: { money: 18, reputation: -4, teamwork: -3, mentality: -2 } },
      },
      {
        id: 'walk_fa',
        label: 'Salir free agent',
        effect: { stats: { reputation: 6, money: -6, mentality: 2 }, flags: { freeAgent: true } },
      },
    ],
  },
  {
    id: 'injury_wrist',
    title: 'Dolor de muñeca',
    body: 'Después de un mes intenso, la muñeca duele al farmear. El fisio recomienda pausa.',
    stages: ['academy', 'challengers', 'tier1', 'worlds'],
    weight: 5,
    choices: [
      {
        id: 'rest_week',
        label: 'Parar una semana',
        effect: { stats: { mentality: 8, mechanics: -4, money: -3 } },
      },
      {
        id: 'play_through',
        label: 'Jugar con painkillers',
        effect: { stats: { mechanics: -6, mentality: -8, reputation: 3 } },
      },
      {
        id: 'physio_plan',
        label: 'Fisio + carga controlada',
        effect: { stats: { money: -8, mentality: 5, mechanics: 3 } },
      },
    ],
  },
  {
    id: 'media_day',
    title: 'Día de prensa',
    body: 'Te preguntan si el mid rival está overrated. El clip puede viralizarse.',
    stages: ['challengers', 'tier1', 'worlds'],
    weight: 5,
    choices: [
      {
        id: 'diplomatic',
        label: 'Respuesta diplomática',
        effect: { stats: { reputation: 6, teamwork: 3 } },
      },
      {
        id: 'spicy_clip',
        label: 'Tirar un spicy take',
        effect: { stats: { reputation: 12, mentality: -3, teamwork: -4 } },
      },
      {
        id: 'silent_pro',
        label: 'Casi no hablar',
        effect: { stats: { reputation: -2, mentality: 4 } },
      },
    ],
  },
  {
    id: 'intl_boot',
    title: 'Bootcamp internacional',
    body: 'Viajás a otra región a preparar el torneo. Jetlag, comida rara y scrims densos.',
    stages: ['tier1', 'worlds'],
    weight: 7,
    choices: [
      {
        id: 'adapt_fast',
        label: 'Adaptarte al ritmo local',
        effect: { stats: { gameSense: 8, teamwork: 6, mentality: -5, money: -5 } },
      },
      {
        id: 'home_routine',
        label: 'Mantener tu rutina de casa',
        effect: { stats: { mentality: 6, mechanics: 4, teamwork: -3 } },
      },
    ],
  },
  {
    id: 'worlds_group',
    title: 'Fase de grupos',
    body: 'Primer partido internacional. Cámaras, idioma mezclado y un error puede costar el swiss.',
    stages: ['worlds'],
    weight: 10,
    choices: [
      {
        id: 'ice_veins',
        label: 'Jugar limpio, sin hero plays',
        effect: { stats: { mentality: 8, teamwork: 8, gameSense: 5, reputation: 6 } },
      },
      {
        id: 'make_play',
        label: 'Buscar la jugada del torneo',
        effect: { stats: { mechanics: 10, reputation: 10, mentality: -6, teamwork: -2 } },
      },
    ],
  },
  {
    id: 'language_barrier',
    title: 'Barrera de idioma',
    body: 'Tu nuevo roster mezcla idiomas. Los calls se pisan en fights.',
    stages: ['challengers', 'tier1', 'worlds'],
    nationTags: ['latam', 'visa-hard', 'multi-lang', 'portuguese'],
    weight: 6,
    choices: [
      {
        id: 'learn_calls',
        label: 'Aprender calls en inglés',
        effect: { stats: { teamwork: 9, mentality: -3, gameSense: 4 } },
      },
      {
        id: 'ping_heavy',
        label: 'Comunicar más con pings',
        effect: { stats: { teamwork: 5, mechanics: 3 } },
      },
      {
        id: 'translator',
        label: 'Pedir staff traductor en voice',
        effect: { stats: { money: -4, teamwork: 7, reputation: 2 } },
      },
    ],
  },
  {
    id: 'stream_vs_team_review',
    title: 'Stream o review de team',
    body: 'Tu comunidad pide stream. El team pide review privada. No da el tiempo para ambos.',
    stages: ['academy', 'challengers'],
    nationTags: ['creator-economy', 'big-audience', 'na', 'br'],
    weight: 5,
    choices: [
      {
        id: 'feed_community',
        label: 'Priorizar la comunidad',
        effect: { stats: { reputation: 10, money: 8, teamwork: -5, gameSense: -2 } },
      },
      {
        id: 'feed_team',
        label: 'Priorizar el equipo',
        effect: { stats: { teamwork: 8, gameSense: 6, reputation: -3, money: -2 } },
      },
    ],
  },
  {
    id: 'patch_notes_night',
    title: 'Patch night',
    body: 'Sale el parche a las 2 AM. El mid rival ya está en custom. ¿Te quedás despierto?',
    stages: ['soloq', 'academy', 'challengers', 'tier1'],
    weight: 5,
    choices: [
      {
        id: 'all_nighter',
        label: 'All-nighter de lab',
        effect: { stats: { gameSense: 7, mechanics: 4, mentality: -7 } },
      },
      {
        id: 'sleep_trust_staff',
        label: 'Dormir; el analista resume mañana',
        effect: { stats: { mentality: 6, teamwork: 4, gameSense: 2 } },
      },
    ],
  },
  {
    id: 'family_pressure',
    title: 'Presión familiar',
    body: 'En casa preguntan cuándo “vas a conseguir un laburo de verdad”. El torneo es en una semana.',
    stages: ['soloq', 'academy'],
    nationTags: ['latam', 'hungry-scene', 'visa-hard'],
    weight: 5,
    choices: [
      {
        id: 'prove_them',
        label: 'Canalizarlo a motivación',
        effect: { stats: { mentality: 6, mechanics: 5, reputation: 2 } },
      },
      {
        id: 'doubt_spiral',
        label: 'Entrar en duda',
        effect: { stats: { mentality: -10, mechanics: -3 } },
      },
      {
        id: 'part_time',
        label: 'Buscar laburo part-time',
        effect: { stats: { money: 10, mechanics: -6, mentality: 2 } },
      },
    ],
  },
  {
    id: 'rival_trash',
    title: 'Trash talk del rival',
    body: 'Un pro de otra región te taguea diciendo que no merecés el roster. El timeline se incendia.',
    stages: ['challengers', 'tier1', 'worlds'],
    weight: 5,
    choices: [
      {
        id: 'mute_twitter',
        label: 'Mute y focus',
        effect: { stats: { mentality: 7, mechanics: 4 } },
      },
      {
        id: 'clap_back',
        label: 'Responder con clap back',
        effect: { stats: { reputation: 8, mentality: -5, teamwork: -2 } },
      },
    ],
  },
  {
    id: 'draft_prison',
    title: 'Prisión de draft',
    body: 'Tu pick signature está banneado tres mapas seguidos. Tenés que inventar.',
    stages: ['challengers', 'tier1', 'worlds'],
    weight: 6,
    choices: [
      {
        id: 'pocket_pick',
        label: 'Sacar un pocket pick loco',
        effect: { stats: { mechanics: 6, reputation: 7, gameSense: -2, mentality: -3 } },
      },
      {
        id: 'team_comp',
        label: 'Jugar para el comp del equipo',
        effect: { stats: { teamwork: 9, gameSense: 5, reputation: 3 } },
      },
    ],
  },
  {
    id: 'org_crisis',
    title: 'Crisis de la org',
    body: 'Se atrasan los sueldos. Rumores de que venden el slot. El vestuario está raro.',
    stages: ['academy', 'challengers', 'tier1'],
    weight: 5,
    choices: [
      {
        id: 'stay_loyal',
        label: 'Quedarte y bancar',
        effect: { stats: { teamwork: 7, mentality: -4, money: -8, reputation: 5 } },
      },
      {
        id: 'look_exit',
        label: 'Buscar salida silenciosa',
        effect: { stats: { reputation: 3, money: 4, teamwork: -6 } },
      },
    ],
  },
];

export const esportsPack: ContentPack = {
  id: 'esports',
  title: 'ProPath',
  subtitle: 'De soloQ al escenario mundial',
  baseStats: {
    mechanics: 35,
    gameSense: 30,
    mentality: 40,
    teamwork: 25,
    reputation: 10,
    money: 20,
  },
  statLabels: {
    mechanics: 'Mecánicas',
    gameSense: 'Game sense',
    mentality: 'Mentalidad',
    teamwork: 'Teamplay',
    reputation: 'Reputación',
    money: 'Plata',
  },
  nations: [
    {
      id: 'ar',
      name: 'Argentina',
      flag: '🇦🇷',
      regionId: 'latam',
      tags: ['latam', 'spanish', 'visa-hard', 'hungry-scene'],
      blurb: 'Escena LATAM Sur: talento alto, infraestructura irregular y visas complicadas.',
      startingStats: { mentality: 8, money: -5 },
      startingFlags: { region: 'latam-south', language: 'es', visaDifficulty: 3 },
    },
    {
      id: 'br',
      name: 'Brasil',
      flag: '🇧🇷',
      regionId: 'latam',
      tags: ['latam', 'portuguese', 'big-audience', 'visa-hard'],
      blurb: 'Escena grande y fanáticos intensos. El salto internacional es caro.',
      startingStats: { reputation: 5, money: -2 },
      startingFlags: { region: 'latam-south', language: 'pt', visaDifficulty: 3 },
    },
    {
      id: 'kr',
      name: 'Corea del Sur',
      flag: '🇰🇷',
      regionId: 'kr',
      tags: ['kr', 'elite-training', 'high-pressure', 'visa-easy-asia'],
      blurb: 'Bootcamps, competencia brutal y expectativa de excelencia desde el día uno.',
      startingStats: { mechanics: 12, gameSense: 8, mentality: -5, money: 5 },
      startingFlags: { region: 'korea', language: 'ko', visaDifficulty: 1 },
    },
    {
      id: 'cn',
      name: 'China',
      flag: '🇨🇳',
      regionId: 'cn',
      tags: ['cn', 'org-money', 'high-pressure'],
      blurb: 'Orgs con presupuesto serio y presión mediática.',
      startingStats: { money: 10, reputation: 5, teamwork: 5 },
      startingFlags: { region: 'china', language: 'zh', visaDifficulty: 2 },
    },
    {
      id: 'us',
      name: 'Estados Unidos',
      flag: '🇺🇸',
      regionId: 'na',
      tags: ['na', 'english', 'visa-easy', 'creator-economy'],
      blurb: 'LANs, creators y sponsors. Menos densidad élite que KR, más networking.',
      startingStats: { money: 12, reputation: 5, mechanics: -3 },
      startingFlags: { region: 'na', language: 'en', visaDifficulty: 1 },
    },
    {
      id: 'eu',
      name: 'Europa (UE)',
      flag: '🇪🇺',
      regionId: 'eu',
      tags: ['eu', 'english', 'multi-lang', 'visa-medium'],
      blurb: 'Ligas regionales sólidas y movilidad europea.',
      startingStats: { gameSense: 5, teamwork: 5, money: 5 },
      startingFlags: { region: 'eu', language: 'en', visaDifficulty: 2 },
    },
  ],
  roles: [
    {
      id: 'mid',
      name: 'Mid',
      description: 'Carry de mapa, pressure y outplays.',
      stakes:
        'Vos marcás el ritmo del mapa. Si salís mal a ayudar, se nota en el marcador — y en la review del coach.',
      startingStats: { mechanics: 8, gameSense: 5 },
      primaryStats: ['mechanics', 'gameSense'],
      signatureCalls: ['prio', 'playmake', 'roam', 'focus'],
      signatureActivity: 'soloq',
    },
    {
      id: 'jungle',
      name: 'Jungle',
      description: 'Ritmo, rutas y llamadas tempranas.',
      stakes:
        'La composición y tu ruta son tuyas. Un mal recorrido temprano te marca la serie; una buena emboscada te hace líder de calls.',
      startingStats: { gameSense: 10, teamwork: 5 },
      primaryStats: ['gameSense', 'teamwork'],
      signatureCalls: ['prio', 'roam', 'steal', 'baron'],
      signatureActivity: 'vod',
    },
    {
      id: 'adc',
      name: 'ADC',
      description: 'Crecés tarde y vivís del posicionamiento con tu support.',
      stakes:
        'Tu valor explota tarde. Dependés del duo: si la línea se rompe, el late nunca llega.',
      startingStats: { mechanics: 10, mentality: 3 },
      primaryStats: ['mechanics', 'mentality'],
      signatureCalls: ['safe', 'farm', 'peel', 'siege'],
      signatureActivity: 'scrim',
    },
    {
      id: 'support',
      name: 'Support',
      description: 'Visión, inicios de pelea y liderazgo en calls.',
      stakes:
        'Pocas kills, mucho control. Si no armás la visión, el carry muere — y la culpa cae igual sobre vos.',
      startingStats: { teamwork: 12, gameSense: 5 },
      primaryStats: ['teamwork', 'gameSense'],
      signatureCalls: ['safe', 'peel', 'steal', 'stall'],
      signatureActivity: 'scrim',
    },
    {
      id: 'top',
      name: 'Top',
      description: 'Enfrentamientos 1v1, teletransportes y cabeza fría.',
      stakes:
        'Línea solitaria. Un mal matchup te deja irrelevante; un teletransporte clutch te convierte en el héroe del split.',
      startingStats: { mentality: 10, mechanics: 5 },
      primaryStats: ['mentality', 'mechanics'],
      signatureCalls: ['flex', 'farm', 'bail', 'close'],
      signatureActivity: 'soloq',
    },
  ],
  stages: [
    { id: 'soloq', name: 'SoloQ / Ranked', order: 1 },
    { id: 'academy', name: 'Academy / Tier 3', order: 2 },
    { id: 'challengers', name: 'Challengers', order: 3 },
    { id: 'tier1', name: 'Liga Tier 1', order: 4 },
    { id: 'worlds', name: 'Internacional', order: 5 },
  ],
  endings: [
    {
      id: 'burnout',
      title: 'Burnout',
      body: 'La cabeza no dio más. El talento quedó en VODs que nadie va a revisar.',
      tier: 'fail',
    },
    {
      id: 'broke_amateur',
      title: 'Amateur sin red',
      body: 'Sin plata ni estructura, la carrera se apagó antes del salto profesional.',
      tier: 'fail',
    },
    {
      id: 'elo_hell',
      title: 'Elo hell eterno',
      body: 'Subís, bajás, tiltás. La escena siguió sin vos.',
      tier: 'fail',
    },
    {
      id: 'regional_grinder',
      title: 'Leyenda del server',
      body: 'Te conocen en tu región. No llegaste al Mundial, pero dejaste huella.',
      tier: 'ok',
    },
    {
      id: 'academy_captain',
      title: 'Capitán Academy',
      body: 'Lideraste un roster joven. Faltó el call-up definitivo, sobró respeto.',
      tier: 'ok',
    },
    {
      id: 'stuck_challengers',
      title: 'Techo Challengers',
      body: 'Siempre cerca del Tier 1, nunca del todo adentro. Carrera respetable, sabor a poco.',
      tier: 'ok',
    },
    {
      id: 'challengers_legend',
      title: 'MVP Challengers',
      body: 'Dominaste la liga de abajo. Las orgs Tier 1 ya tienen tu número.',
      tier: 'great',
    },
    {
      id: 'tier1_bench',
      title: 'Banco Tier 1',
      body: 'Llegaste al club grande, pero el starter te comió el posto. Aprendiste caro.',
      tier: 'ok',
    },
    {
      id: 'tier1_starter',
      title: 'Starter Tier 1',
      body: 'Jugás de titular en la liga top. Sos parte del ecosistema global.',
      tier: 'great',
    },
    {
      id: 'international_regular',
      title: 'Regular internacional',
      body: 'Viajás cada año al torneo grande. No siempre ganás, pero siempre competís.',
      tier: 'great',
    },
    {
      id: 'world_finalist',
      title: 'Finalista mundial',
      body: 'Estuviste a un mapa de la gloria. Tu nombre ya es historia del circuito.',
      tier: 'legend',
    },
  ],
  events: [...events, ...hubEvents, ...regionalEvents],
};
