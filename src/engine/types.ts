/** Motor genérico de carrera por decisiones — reusable (esports, política, etc.) */

export type StatId = string;
export type Stats = Record<StatId, number>;
export type Flags = Record<string, boolean | string | number>;

export type RunDurationId = 'sprint' | 'season' | 'epic';

export interface RunDuration {
  id: RunDurationId;
  label: string;
  blurb: string;
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
  relations?: Partial<Relations>;
}

export interface Choice {
  id: string;
  label: string;
  hint?: string;
  effect: ChoiceEffect;
  requireFlags?: Flags;
}

export type MinigameKind =
  | 'reaction'
  | 'draft'
  | 'farm'
  | 'vision'
  | 'focus'
  | 'combo'
  | 'dodge'
  | 'clutch'
  | 'interview'
  | 'negotiation';

export interface EventMinigame {
  kind: MinigameKind;
  title: string;
  blurb: string;
  difficulty: 1 | 2 | 3;
}

export type WeekActivityId = 'soloq' | 'scrim' | 'vod' | 'rest' | 'content' | 'match';

export interface GameEvent {
  id: string;
  title: string;
  body: string;
  stages: string[];
  nationTags?: string[];
  excludeNationTags?: string[];
  /** Preferir si la última actividad fue esta */
  activityTags?: WeekActivityId[];
  /** Requiere relación mínima */
  requireRelations?: Partial<Relations>;
  weight?: number;
  choices: Choice[];
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

export interface Relations {
  coach: number;
  duo: number;
  rival: number;
  manager: number;
}

/** Un factor que empujó el resultado, para que el jugador entienda por qué. */
export interface MatchFactor {
  label: string;
  value: number;
}

export interface MatchResult {
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
  mvp: boolean;
  opponent: string;
  scoreLine: string;
  highlights: string[];
  factors: MatchFactor[];
}

export type CareerPhase = 'hub' | 'event' | 'match';

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
  lastNotice: string | null;
  /** Forma competitiva 0–100 */
  form: number;
  /** Fatiga 0–100 */
  fatigue: number;
  relations: Relations;
  lastActivity: WeekActivityId | null;
  lastMatch: MatchResult | null;
  phase: CareerPhase;
  ticker: string[];
  wins: number;
  losses: number;
  /** Objetivos de temporada ya cobrados */
  claimedObjectives: string[];
}
