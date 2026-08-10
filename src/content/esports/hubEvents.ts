import type { GameEvent } from '../../engine/types';

/** Eventos gatillados por actividad, relaciones o último partido */
export const hubEvents: GameEvent[] = [
  {
    id: 'soloq_tilt_after_grind',
    title: 'Chat tóxico después de ranked',
    body: 'Después de una semana de ranked solo, alguien te insulta. {{duo}} te escribe: “¿cerramos?”',
    stages: ['soloq', 'academy'],
    activityTags: ['soloq'],
    weight: 8,
    minigame: {
      kind: 'combo',
      title: 'Combo bajo presión',
      blurb: 'Repetí la secuencia de habilidades con el chat encima.',
      difficulty: 2,
    },
    choices: [
      {
        id: 'mute_climb',
        label: 'Silenciar a todos y seguir',
        hint: '+mecánicas · −mentalidad',
        effect: { stats: { mechanics: 4, mentality: -3 }, relations: { duo: 2 } },
      },
      {
        id: 'duo_up',
        label: 'Jugar de a dos con {{duo}}',
        hint: '+equipo · +mentalidad',
        effect: { stats: { teamwork: 5, mentality: 4 }, relations: { duo: 6 } },
      },
      {
        id: 'tweet_back',
        label: 'Respuesta pasivo-agresiva',
        hint: '−reputación',
        effect: { stats: { reputation: -4, mentality: -6 }, relations: { rival: 4 } },
      },
    ],
  },
  {
    id: 'scrim_coach_talk',
    title: '1-on-1 con {{coach}}',
    body: 'El coach te llama aparte tras el bloque. “Estás manejando mal las oleadas.”',
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
    body: 'Tu manager empuja un collab. {{coach}} ya agendó el bloque. No podés hacer las dos.',
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
    body: 'Dormiste bien. El fisio dice que estás listo… si no volvés a grindear 14 horas.',
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
    body: 'La serie quedó 1–0. Duo te choca el hombro. {{coach}} sonríe una vez.',
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
    minigame: {
      kind: 'dodge',
      title: 'Reposicionamiento',
      blurb: 'El coach marca las zonas donde moriste. Esquivalas otra vez.',
      difficulty: 2,
    },
    choices: [
      {
        id: 'own_it',
        label: 'Bancártela en la review',
        effect: {
          stats: { gameSense: 5, mentality: 2 },
          relations: { coach: 4, rival: 2 },
        },
      },
      {
        id: 'blame_draft',
        label: 'Culpar la composición',
        effect: { stats: { teamwork: -5, mentality: -4 }, relations: { coach: -5, duo: -3 } },
      },
      {
        id: 'queue_revenge',
        label: 'Abrir ranked enojado',
        effect: { stats: { mechanics: 2, mentality: -8 } },
      },
    ],
  },
  {
    id: 'duo_chemistry_peak',
    title: 'Synergy con el duo',
    body: '{{duo}} y vos leen el mismo timing sin hablar. {{coach}} lo nota en el entrenamiento.',
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
    minigame: {
      kind: 'clutch',
      title: 'Duelo de lane',
      blurb: 'Uno contra uno. El timing decide quién se lleva el highlight.',
      difficulty: 3,
    },
    choices: [
      {
        id: 'lock_in',
        label: 'Entrar y demostrar',
        effect: { stats: { mechanics: 6, mentality: -2 }, relations: { rival: 5 } },
      },
      {
        id: 'respect_ff',
        label: 'Jugar limpio, sin flame',
        effect: { stats: { reputation: 4, mentality: 3 }, relations: { rival: 2 } },
      },
    ],
  },
  {
    id: 'manager_visa_talk',
    title: 'Visa y calendario',
    body: '{{manager}} pone un PDF en la mesa: invitacional afuera. Falta papelería y forma.',
    stages: ['challengers', 'tier1', 'worlds'],
    activityTags: ['content', 'rest', 'match'],
    requireRelations: { manager: 40 },
    weight: 9,
    minigame: {
      kind: 'negotiation',
      title: 'Presupuesto de viaje',
      blurb: 'Cuánto pedís para bancar visas, bootcamp y staff.',
      difficulty: 3,
    },
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
  {
    id: 'press_conference',
    title: 'Conferencia post-serie',
    body: 'Tres micrófonos, una cámara y periodistas que ya escribieron el título.',
    stages: ['challengers', 'tier1', 'worlds'],
    activityTags: ['match', 'content'],
    weight: 9,
    minigame: {
      kind: 'interview',
      title: 'Sala de prensa',
      blurb: 'Respondé rápido y sin regalar titulares.',
      difficulty: 2,
    },
    choices: [
      {
        id: 'short_answers',
        label: 'Respuestas cortas y neutras',
        effect: { stats: { reputation: 2, mentality: 2 } },
      },
      {
        id: 'skip_press',
        label: 'Mandar al manager en tu lugar',
        effect: { stats: { reputation: -4 }, relations: { manager: -3 } },
      },
    ],
  },
  {
    id: 'contract_offer',
    title: 'Oferta sobre la mesa',
    body: '{{manager}} desliza un contrato. Podés firmar lo razonable o pedir más y arriesgar.',
    stages: ['challengers', 'tier1', 'worlds'],
    activityTags: ['content', 'rest', 'match'],
    requireRelations: { manager: 30 },
    weight: 9,
    minigame: {
      kind: 'negotiation',
      title: 'Mesa de negociación',
      blurb: 'Parar la aguja en la franja justa. O ir por el doble.',
      difficulty: 2,
    },
    choices: [
      {
        id: 'sign_standard',
        label: 'Firmar lo estándar',
        effect: { stats: { money: 10, mentality: 3 }, relations: { manager: 3 } },
      },
      {
        id: 'delay_signing',
        label: 'Esperar mejor momento',
        effect: { stats: { money: -2, reputation: 2 }, relations: { manager: -2 } },
      },
    ],
  },

  // —— Eventos legacy con filtro de rol ——
  {
    id: 'mid_wave_lab',
    title: 'Lab de oleadas mid',
    body: '{{coach}} pone la replay en pausa: empujás la oleada un segundo tarde. Solo mid lo ve así.',
    stages: ['soloq', 'academy', 'challengers'],
    roleTags: ['mid'],
    activityTags: ['vod', 'soloq'],
    weight: 10,
    choices: [
      {
        id: 'drill_waves',
        label: 'Practicar oleadas',
        effect: { stats: { gameSense: 6, mechanics: 2 }, relations: { coach: 4 } },
      },
      {
        id: 'skip_lab',
        label: 'Saltar el lab',
        effect: { stats: { mentality: -2 }, relations: { coach: -3 } },
      },
    ],
  },
  {
    id: 'jgl_camp_timing',
    title: 'Timing de campamentos',
    body: 'Limpiar el segundo buff te deja tarde al objetivo del río. {{coach}} quiere una ruta nueva esta semana.',
    stages: ['academy', 'challengers', 'tier1'],
    roleTags: ['jungle'],
    activityTags: ['vod', 'scrim'],
    weight: 10,
    choices: [
      {
        id: 'new_path',
        label: 'Adoptar la ruta nueva',
        effect: { stats: { gameSense: 7 }, relations: { coach: 5 } },
      },
      {
        id: 'keep_style',
        label: 'Mantener tu estilo',
        effect: { stats: { mechanics: 3, teamwork: -2 }, relations: { coach: -4 } },
      },
    ],
  },
  {
    id: 'bot_lane_sync',
    title: 'Sincronizar bot',
    body: '{{duo}} propone un plan de intercambios. O se alinean o la línea se rompe sola.',
    stages: ['soloq', 'academy', 'challengers'],
    roleTags: ['adc', 'support'],
    activityTags: ['scrim', 'soloq'],
    weight: 10,
    choices: [
      {
        id: 'sync_plan',
        label: 'Alinear el plan',
        effect: { stats: { teamwork: 6, gameSense: 2 }, relations: { duo: 6 } },
      },
      {
        id: 'solo_carry',
        label: 'Jugar tu tempo',
        effect: { stats: { mechanics: 4, teamwork: -3 }, relations: { duo: -4 } },
      },
    ],
  },
  {
    id: 'top_matchup_book',
    title: 'Libro de matchups',
    body: '{{coach}} te pasa un doc: counters y freeze windows. En top, esto es supervivencia.',
    stages: ['soloq', 'academy', 'challengers'],
    roleTags: ['top'],
    activityTags: ['vod', 'soloq'],
    weight: 10,
    choices: [
      {
        id: 'study_book',
        label: 'Estudiar el libro',
        effect: { stats: { gameSense: 5, mentality: 3 }, relations: { coach: 4 } },
      },
      {
        id: 'queue_blind',
        label: 'Queuear a ciegas',
        effect: { stats: { mechanics: 3, mentality: -3 }, relations: { coach: -2 } },
      },
    ],
  },
];
