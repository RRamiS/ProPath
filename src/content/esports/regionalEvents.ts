import type { GameEvent } from '../../engine/types';

/**
 * Eventos inspirados en la cultura real del submundo competitive MOBA
 * (team houses, visas, bootcamps, content vs scrims) — sin nombres de orgs/juegos reales.
 */
export const regionalEvents: GameEvent[] = [
  {
    id: 'cyber_cafe_night',
    title: 'Noche de cyber',
    body: 'El aire acondicionado falla y el ping salta. Todavía estás farmeando LP porque en casa no hay PC decente.',
    stages: ['soloq'],
    nationTags: ['latam', 'hungry-scene', 'visa-hard'],
    weight: 7,
    choices: [
      {
        id: 'pay_vip',
        label: 'Pagar PC VIP con mejor red',
        effect: { stats: { money: -6, mechanics: 5, mentality: 2 }, flags: { cafeVip: true } },
      },
      {
        id: 'endure_lag',
        label: 'Aguantar el lag y adaptar',
        effect: { stats: { gameSense: 6, mentality: -4, mechanics: 2 } },
      },
    ],
    minigame: {
      kind: 'farm',
      title: 'Last-hit con ping alto',
      blurb: 'La oleada llega desfasada. Tocá cuando el minion esté listo para morir.',
      difficulty: 2,
    },
  },
  {
    id: 'bus_to_lan',
    title: 'Micro al LAN',
    body: 'Viaje de 14 horas en bondi con el setup en una mochila. Llegás mareado al venue regional.',
    stages: ['soloq', 'academy'],
    nationTags: ['latam', 'hungry-scene'],
    weight: 6,
    choices: [
      {
        id: 'sleep_bus',
        label: 'Dormir en el asiento y llegar fresco',
        effect: { stats: { mentality: 6, money: -4, reputation: 4 } },
      },
      {
        id: 'vod_bus',
        label: 'Mirar VODs del rival en el celular',
        effect: { stats: { gameSense: 7, mentality: -5, reputation: 3 } },
      },
    ],
  },
  {
    id: 'predatory_contract',
    title: 'Contrato chico con letra grande',
    body: 'Una org regional ofrece “exposición”. El PDF esconde buyout absurdo y multas por streamear.',
    stages: ['soloq', 'academy'],
    nationTags: ['latam', 'visa-hard', 'hungry-scene'],
    weight: 6,
    choices: [
      {
        id: 'lawyer_friend',
        label: 'Mandárselo a un conocido de derecho',
        effect: { stats: { money: -3, reputation: 4, mentality: 3 }, flags: { smartContract: true } },
      },
      {
        id: 'sign_blind',
        label: 'Firmar: necesito el entry',
        effect: { stats: { money: 5, reputation: 6, mentality: -4 }, flags: { badContract: true } },
      },
      {
        id: 'walk_away',
        label: 'Caminar: mejor free agent',
        effect: { stats: { mentality: 5, reputation: -2 } },
      },
    ],
  },
  {
    id: 'silent_vod_room',
    title: 'Sala de VOD en silencio',
    body: 'Nadie habla hasta que el analista pausa el frame. Señalan tu death en river como si fuera un examen.',
    stages: ['academy', 'challengers', 'tier1'],
    nationTags: ['kr', 'elite-training', 'high-pressure'],
    weight: 7,
    choices: [
      {
        id: 'own_mistake',
        label: 'Admitir el error y proponer fix',
        effect: { stats: { gameSense: 8, teamwork: 6, mentality: -2 } },
      },
      {
        id: 'deflect',
        label: 'Explicar el ping / vision gap',
        effect: { stats: { reputation: -4, mentality: -3, teamwork: -4 } },
      },
    ],
    minigame: {
      kind: 'reaction',
      title: 'Escape sobre el muro',
      blurb: 'En el VOD el coach marca el frame: acá había que flashear. Probá el timing.',
      difficulty: 3,
    },
  },
  {
    id: 'dawn_scrim_block',
    title: 'Bloque de scrims hasta la madrugada',
    body: 'Tercer bloque del día. El body clock está roto, pero el path del rival recién aparece en el VOD.',
    stages: ['challengers', 'tier1', 'worlds'],
    nationTags: ['kr', 'elite-training', 'cn', 'high-pressure'],
    weight: 6,
    choices: [
      {
        id: 'push_through',
        label: 'Empujar una hora más',
        effect: { stats: { gameSense: 6, mechanics: 4, mentality: -8 } },
      },
      {
        id: 'ask_cut',
        label: 'Pedir corte: condition first',
        effect: { stats: { mentality: 7, teamwork: 3, reputation: -2 } },
      },
    ],
  },
  {
    id: 'momentum_locker',
    title: 'Momentum del vestuario',
    body: 'En esta región el “estado de ánimo” mueve más el mapa que el doc de strategy. Hoy el vestuario está frío.',
    stages: ['challengers', 'tier1'],
    nationTags: ['cn', 'org-money', 'high-pressure'],
    weight: 6,
    choices: [
      {
        id: 'hype_speech',
        label: 'Romper el hielo con una charla corta',
        effect: { stats: { teamwork: 9, mentality: 5, reputation: 3 } },
      },
      {
        id: 'solo_focus',
        label: 'Auriculares y focus individual',
        effect: { stats: { mechanics: 6, teamwork: -5 } },
      },
    ],
  },
  {
    id: 'city_hop_fatigue',
    title: 'Fatiga de traslados',
    body: 'Otra ciudad, otro hotel, otro setup improvisado. El jetlag come más que el rival.',
    stages: ['tier1', 'worlds'],
    nationTags: ['cn', 'org-money'],
    weight: 5,
    choices: [
      {
        id: 'sleep_protocol',
        label: 'Protocolo de sueño estricto',
        effect: { stats: { mentality: 8, mechanics: 2, money: -2 } },
      },
      {
        id: 'grind_anyway',
        label: 'Ranked en el hotel hasta tarde',
        effect: { stats: { mechanics: 5, mentality: -7 } },
      },
    ],
  },
  {
    id: 'stream_vs_scrim',
    title: 'Stream o scrim cerrado',
    body: 'Tu comunidad pide content. El staff quiere scrim off-stream para no filtrar strats. No hay tiempo para ambos.',
    stages: ['academy', 'challengers', 'tier1'],
    nationTags: ['creator-economy', 'na', 'eu', 'big-audience', 'br'],
    weight: 7,
    choices: [
      {
        id: 'public_scrim',
        label: 'Streamear el scrim (marca + riesgo)',
        effect: { stats: { reputation: 12, money: 8, teamwork: -4, gameSense: -2 } },
      },
      {
        id: 'closed_doors',
        label: 'Puertas cerradas: solo el team',
        effect: { stats: { teamwork: 8, gameSense: 6, reputation: -3, money: -3 } },
      },
    ],
  },
  {
    id: 'brand_deal_mid_split',
    title: 'Deal de marca a mitad de split',
    body: 'Una marca quiere un short semanal. El filming come un bloque de soloQ.',
    stages: ['challengers', 'tier1'],
    nationTags: ['creator-economy', 'na', 'eu', 'big-audience'],
    weight: 5,
    choices: [
      {
        id: 'take_deal',
        label: 'Firmar el deal',
        effect: { stats: { money: 14, reputation: 6, mechanics: -4 } },
      },
      {
        id: 'decline_deal',
        label: 'Priorizar el split',
        effect: { stats: { mechanics: 5, mentality: 3, money: -2 } },
      },
    ],
  },
  {
    id: 'multi_lang_calls',
    title: 'Calls en tres idiomas',
    body: 'En teamfight se pisan el inglés, el idioma local y los pings. El engage sale tarde.',
    stages: ['challengers', 'tier1', 'worlds'],
    nationTags: ['eu', 'multi-lang', 'latam', 'portuguese'],
    weight: 6,
    choices: [
      {
        id: 'one_lang',
        label: 'Imponer un solo idioma de calls',
        effect: { stats: { teamwork: 9, mentality: -3, reputation: 3 } },
      },
      {
        id: 'ping_system',
        label: 'Sistema de pings + keywords cortas',
        effect: { stats: { teamwork: 7, gameSense: 4 } },
      },
    ],
    minigame: {
      kind: 'draft',
      title: 'Draft con lío de idiomas',
      blurb: 'El call llega mezclado. Elegí la línea de draft que abre el mapa.',
      difficulty: 2,
    },
  },
  {
    id: 'tryout_server_hop',
    title: 'Tryout en server ajeno',
    body: 'Te prueban desde otra región. 90+ ms, meta distinta, y el shotcaller habla rápido.',
    stages: ['academy', 'challengers'],
    nationTags: ['visa-hard', 'latam', 'hungry-scene'],
    weight: 6,
    choices: [
      {
        id: 'adapt_ping',
        label: 'Jugar más predictivo por el ping',
        effect: { stats: { gameSense: 8, mechanics: 3, mentality: -2 } },
      },
      {
        id: 'force_mechanics',
        label: 'Forzar outplays igual',
        effect: { stats: { mechanics: 5, reputation: -3, mentality: -4 } },
      },
    ],
    minigame: {
      kind: 'reaction',
      title: 'Gank con ping alto',
      blurb: 'La info llega tarde. Anticipá y flasheá el engage antes de morir.',
      difficulty: 3,
    },
  },
  {
    id: 'house_hygiene_war',
    title: 'Guerra de la team house',
    body: 'Platos, horarios de ducha y un teammate que duerme en el setup. La sinergia se pudre off-game.',
    stages: ['academy', 'challengers'],
    weight: 5,
    choices: [
      {
        id: 'rules_board',
        label: 'Armar reglas de convivencia',
        effect: { stats: { teamwork: 8, mentality: 4, reputation: 2 } },
      },
      {
        id: 'ignore_mess',
        label: 'Ignorar y solo jugar',
        effect: { stats: { mechanics: 3, teamwork: -6, mentality: -4 } },
      },
    ],
  },
  {
    id: 'analyst_sheet',
    title: 'Doc del analista a las 2 AM',
    body: 'Llega un sheet de 40 slides sobre el rival. El cuerpo pide dormir; el ego pide leerlo todo.',
    stages: ['challengers', 'tier1', 'worlds'],
    weight: 5,
    choices: [
      {
        id: 'skim_key',
        label: 'Leer solo las win conditions',
        effect: { stats: { gameSense: 6, mentality: 4 } },
      },
      {
        id: 'all_nighter_doc',
        label: 'Leerlo entero esta noche',
        effect: { stats: { gameSense: 10, mentality: -7 } },
      },
    ],
    minigame: {
      kind: 'draft',
      title: 'Aplicar el sheet del analista',
      blurb: 'Con lo que retenés del doc, ¿qué composición conviene?',
      difficulty: 2,
    },
  },
  {
    id: 'sub_race',
    title: 'Carrera contra el sub',
    body: 'El sub farmea tu rol en customs públicas. Twitter ya elige bando.',
    stages: ['challengers', 'tier1'],
    weight: 5,
    choices: [
      {
        id: 'prove_scrim',
        label: 'Cerrar el puesto en scrims',
        effect: { stats: { mechanics: 8, teamwork: 4, mentality: -3 } },
      },
      {
        id: 'mute_noise',
        label: 'Mute al timeline',
        effect: { stats: { mentality: 8, reputation: -2 } },
      },
    ],
    minigame: {
      kind: 'farm',
      title: 'Oleada bajo presión',
      blurb: 'El coach mira el overlay de farm. No regales minions.',
      difficulty: 2,
    },
  },
  {
    id: 'ward_war',
    title: 'Guerra de visión',
    body: 'El river está ciego. Sin wards, cada rotate es una ruleta. El analista pide control de mapa YA.',
    stages: ['academy', 'challengers', 'tier1'],
    weight: 6,
    choices: [
      {
        id: 'buy_control',
        label: 'Gastar en wards de control',
        effect: { stats: { gameSense: 7, money: -5, teamwork: 4 } },
      },
      {
        id: 'greedy_farm',
        label: 'Ignorar visión y farmear',
        effect: { stats: { mechanics: 4, gameSense: -5, mentality: -2 } },
      },
    ],
    minigame: {
      kind: 'vision',
      title: 'Poner wards a tiempo',
      blurb: 'La niebla se abre un segundo. Tocá los huecos antes de que se cierren.',
      difficulty: 2,
    },
  },
  {
    id: 'teamfight_call',
    title: 'Call de teamfight',
    body: 'Se arma la pelea en el objetivo. Todo el mundo grita distinto. Necesitan un foco claro.',
    stages: ['challengers', 'tier1', 'worlds'],
    weight: 7,
    choices: [
      {
        id: 'you_call',
        label: 'Tomar el call vos',
        effect: { stats: { teamwork: 8, reputation: 5, mentality: -2 } },
      },
      {
        id: 'trust_shot',
        label: 'Dejar al shotcaller',
        effect: { stats: { teamwork: 5, mentality: 3 } },
      },
    ],
    minigame: {
      kind: 'focus',
      title: '¿A quién pegamos?',
      blurb: 'Sale el call. Elegí el objetivo correcto en la pelea.',
      difficulty: 2,
    },
  },
];
