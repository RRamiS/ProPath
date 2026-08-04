/** Motor genérico de carrera por decisiones — reusable (esports, política, etc.) */

export type StatId = string;

export type Stats = Record<StatId, number>;

export type Flags = Record<string, boolean | string | number>;

/** Duración de la partida — el jugador la elige al crear el PJ */
export type RunDurationId = 'sprint' | 'season' | 'epic';

export interface RunDuration {
  id: RunDurationId;
  label: string;
  blurb: string;
  /** Decisiones hasta el ending (ni muy corto ni infinito) */
  maxTurns: number;
  minutesHint: string;
}

export const RUN_DURATIONS: RunDuration[] = [
  {
    id: 'sprint',
    label: 'Rápida',
    blurb: 'Una temporada condensada. Ideal para probar builds.',
    maxTurns: 12,
    minutesHint: '~8–12 min',
  },
  {
    id: 'season',
    label: 'Estándar',
    blurb: 'El arco completo: ranked → academy → escena seria.',
    maxTurns: 20,
    minutesHint: '~15–22 min',
  },
  {
    id: 'epic',
    label: 'Épica',
    blurb: 'Carrera larga con más drama, visas y metas internacionales.',
    maxTurns: 32,
    minutesHint: '~25–40 min',
  },
];

export function getDuration(id: RunDurationId): RunDuration {
  return RUN_DURATIONS.find((d) => d.id === id) ?? RUN_DURATIONS[1]!;
}

export interface Nation {
  id: string;
  name: string;
  flag: string;
  regionId: string;
  startingStats: Partial<Stats>;
  startingFlags: Flags;
  tags: string[];
  blurb: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  startingStats: Partial<Stats>;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  entryHint?: string;
}

export interface ChoiceEffect {
  stats?: Partial<Stats>;
  flags?: Flags;
  setStage?: string;
  ending?: string;
}

export interface Choice {
  id: string;
  label: string;
  hint?: string;
  effect: ChoiceEffect;
  requireFlags?: Flags;
}

export type MinigameKind = 'reaction' | 'draft' | 'farm' | 'vision' | 'focus';

export interface EventMinigame {
  kind: MinigameKind;
  title: string;
  blurb: string;
  /** 1 fácil → 3 hard */
  difficulty: 1 | 2 | 3;
}

export interface GameEvent {
  id: string;
  title: string;
  body: string;
  stages: string[];
  nationTags?: string[];
  excludeNationTags?: string[];
  weight?: number;
  choices: Choice[];
  /** Si existe, el evento abre un skill-check interactivo */
  minigame?: EventMinigame;
}

export interface Ending {
  id: string;
  title: string;
  body: string;
  tier: 'fail' | 'ok' | 'great' | 'legend';
}

export interface ContentPack {
  id: string;
  title: string;
  subtitle: string;
  statLabels: Record<StatId, string>;
  nations: Nation[];
  roles: Role[];
  stages: Stage[];
  events: GameEvent[];
  endings: Ending[];
  baseStats: Stats;
}

export interface PlayerProfile {
  name: string;
  nationId: string;
  roleId: string;
  durationId: RunDurationId;
}

export interface CareerState {
  packId: string;
  profile: PlayerProfile;
  stats: Stats;
  flags: Flags;
  stageId: string;
  turn: number;
  maxTurns: number;
  durationId: RunDurationId;
  history: string[];
  currentEventId: string | null;
  endingId: string | null;
  rngSeed: number;
  /** Mensaje corto si hubo promoción de etapa */
  lastNotice: string | null;
}
