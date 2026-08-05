import type { GameEvent } from '../../engine/types';

/** Eventos gatillados por actividad, relaciones o último partido */
export const hubEvents: GameEvent[] = [
  {
    id: 'soloq_tilt_after_grind',
    title: 'Chat tóxico post-grind',
    body: 'Después de una semana de SoloQ, un flame te clava. Nyx te escribe: “¿cerramos?”',
    stages: ['soloq', 'academy'],
    activityTags: ['soloq'],
    weight: 8,
    choices: [
      {
        id: 'mute_climb',
        label: 'Mute all y seguir',
        effect: { stats: { mechanics: 4, mentality: -3 }, relations: { duo: 2 } },
      },
      {
        id: 'duo_up',
        label: 'Duo con Nyx',
        effect: { stats: { teamwork: 5, mentality: 4 }, relations: { duo: 6 } },
      },
      {
        id: 'tweet_back',
        label: 'Respuesta pasivo-agresiva',
        effect: { stats: { reputation: -4, mentality: -6 }, relations: { rival: 4 } },
      },
    ],
  },
  {
    id: 'scrim_coach_talk',
    title: '1-on-1 con Marek',
    body: 'El coach te llama aparte tras el bloque. “Tu wave management está flojo.”',
    stages: ['academy', 'challengers', 'tier1'],
    activityTags: ['scrim', 'vod'],
    requireRelations: { coach: 35 },
    weight: 9,
    choices: [
      {
        id: 'accept_lab',
        label: 'Aceptar el lab extra',
        effect: {
          stats: { gameSense: 7, mentality: 2 },
          relations: { coach: 5 },
        },
      },
      {
        id: 'push_back',
        label: 'Defender tu estilo',
        effect: { stats: { mechanics: 3, teamwork: -4 }, relations: { coach: -6 } },
      },
    ],
  },
  {
    id: 'content_vs_scrim',
    title: 'Stream o scrim',
    body: 'Tu manager empuja un collab. Marek ya agendó el bloque. No podés hacer las dos.',
    stages: ['academy', 'challengers', 'tier1'],
    activityTags: ['content'],
    requireRelations: { manager: 25 },
    weight: 8,
    choices: [
      {
        id: 'pick_content',
        label: 'Hacer el collab',
        effect: {
          stats: { reputation: 8, money: 7, teamwork: -5 },
          relations: { manager: 5, coach: -4, duo: -2 },
        },
      },
      {
        id: 'pick_scrim',
        label: 'Priorizar el team',
        effect: {
          stats: { teamwork: 6, reputation: -2 },
          relations: { coach: 4, duo: 3, manager: -3 },
        },
      },
    ],
  },
  {
    id: 'rest_body_check',
    title: 'Chequeo físico',
    body: 'Dormiste bien. El fisio dice que estás listo… si no volvés a farmear 14h.',
    stages: ['soloq', 'academy', 'challengers'],
    activityTags: ['rest'],
    weight: 7,
    choices: [
      {
        id: 'stay_rested',
        label: 'Mantener el protocolo',
        effect: { stats: { mentality: 6 }, relations: { coach: 2 } },
      },
      {
        id: 'sneak_games',
        label: 'Meter ranked “un rato”',
        effect: { stats: { mechanics: 4, mentality: -4 } },
      },
    ],
  },
  {
    id: 'match_win_locker',
    title: 'Vestuario post-win',
    body: 'La serie quedó 1–0. Duo te choca el hombro. Marek sonríe una vez.',
    stages: ['academy', 'challengers', 'tier1', 'worlds'],
    activityTags: ['match', 'scrim'],
    weight: 10,
    choices: [
      {
        id: 'humble',
        label: 'Hablar del next game',
        effect: { stats: { teamwork: 5, mentality: 3 }, relations: { coach: 3, duo: 3 } },
      },
      {
        id: 'clip_it',
        label: 'Subir el clip MVP',
        effect: { stats: { reputation: 7, money: 3 }, relations: { manager: 4 } },
      },
    ],
  },
  {
    id: 'match_loss_tilt',
    title: 'Review después del loss',
    body: 'El VOD duele. El rival de tu región twitteó el highlight donde morís.',
    stages: ['academy', 'challengers', 'tier1'],
    activityTags: ['match'],
    weight: 10,
    choices: [
      {
        id: 'own_it',
        label: 'Own it en review',
        effect: {
          stats: { gameSense: 5, mentality: 2 },
          relations: { coach: 4, rival: 2 },
        },
      },
      {
        id: 'blame_draft',
        label: 'Culpar el draft',
        effect: { stats: { teamwork: -5, mentality: -4 }, relations: { coach: -5, duo: -3 } },
      },
      {
        id: 'queue_revenge',
        label: 'Abrir SoloQ de tilt',
        effect: { stats: { mechanics: 2, mentality: -8 } },
      },
    ],
  },
  {
    id: 'duo_chemistry_peak',
    title: 'Synergy con el duo',
    body: 'Nyx y vos leen el mismo timer sin hablar. Marek lo nota en el scrim.',
    stages: ['academy', 'challengers', 'tier1'],
    activityTags: ['scrim', 'soloq'],
    requireRelations: { duo: 60 },
    weight: 7,
    choices: [
      {
        id: 'lock_duo',
        label: 'Pedir más bloques juntos',
        effect: { stats: { teamwork: 8 }, relations: { duo: 5, coach: 2 } },
      },
      {
        id: 'keep_cool',
        label: 'No inflar el ego',
        effect: { stats: { mentality: 4, gameSense: 3 }, relations: { duo: 2 } },
      },
    ],
  },
  {
    id: 'rival_same_server',
    title: 'El rival en tu lobby',
    body: 'Carga la pantalla: es tu rival regional. Chat ya eligió bando.',
    stages: ['soloq', 'academy', 'challengers'],
    activityTags: ['soloq', 'match'],
    requireRelations: { rival: 40 },
    weight: 8,
    choices: [
      {
        id: 'lock_in',
        label: 'Lock in y demonstrar',
        effect: { stats: { mechanics: 6, mentality: -2 }, relations: { rival: 5 } },
      },
      {
        id: 'respect_ff',
        label: 'Jugar clean, sin flame',
        effect: { stats: { reputation: 4, mentality: 3 }, relations: { rival: 2 } },
      },
    ],
  },
  {
    id: 'manager_visa_talk',
    title: 'Visa y calendario',
    body: 'Sola pone un PDF en la mesa: invitacional afuera. Falta papelería y forma.',
    stages: ['challengers', 'tier1', 'worlds'],
    activityTags: ['content', 'rest', 'match'],
    requireRelations: { manager: 40 },
    weight: 9,
    choices: [
      {
        id: 'push_visa',
        label: 'Priorizar papeles + form',
        effect: {
          stats: { money: -6, mentality: 3, reputation: 5 },
          relations: { manager: 6 },
          flags: { visa_track: 1 },
        },
      },
      {
        id: 'delay_visa',
        label: '“Después del split”',
        effect: { stats: { money: 4 }, relations: { manager: -4 } },
      },
    ],
  },
  {
    id: 'team_house_noise',
    title: 'Team house a las 3am',
    body: 'Alguien streamea en la sala común. Vos tenés scrim temprano.',
    stages: ['academy', 'challengers', 'tier1'],
    activityTags: ['rest', 'scrim'],
    weight: 6,
    choices: [
      {
        id: 'headphones',
        label: 'Auriculares + routine',
        effect: { stats: { mentality: 3 }, relations: { duo: 1 } },
      },
      {
        id: 'confront',
        label: 'Pedir silencio',
        effect: { stats: { teamwork: -2 }, relations: { coach: 2, duo: -2 } },
      },
      {
        id: 'join_chaos',
        label: 'Sumarte al caos',
        effect: { stats: { reputation: 3, mentality: -5 } },
      },
    ],
  },
];
