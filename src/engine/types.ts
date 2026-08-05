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
    blurb: 'Temporadas cortas (12 sem). Ideal para probar el loop.',
    maxTurns: 12,
    minutesHint: '~8–12 min / temp.',
  },
  {
    id: 'season',
    label: 'Estándar',
    blurb: 'Splits de 20 semanas. La carrera sigue si querés.',
    maxTurns: 20,
    minutesHint: '~15–22 min / temp.',
  },
  {
    id: 'epic',
    label: 'Épica',
    blurb: 'Splits largos (32 sem). Edad, plata y legado pesan más.',
    maxTurns: 32,
    minutesHint: '~25–40 min / temp.',
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

export type CareerPhase = 'hub' | 'event' | 'match' | 'seasonBreak';

/** La semana se juega en dos bloques: lo que hacés de día y lo que hacés de noche. */
export type Daypart = 'day' | 'night';

/** Sedes del mapa: cada una abre una habitación distinta. */
export type VenueId = 'home' | 'gym' | 'cafe' | 'academy' | 'arena';

export interface CareerState {
  packId: string;
  profile: PlayerProfile;
  stats: Stats;
  flags: Flags;
  stageId: string;
  /** Semanas totales de carrera (no corta el juego). */
  turn: number;
  /** Semanas por temporada (antes era el hard-end). */
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
  daypart: Daypart;
  /** Objetivos de temporada ya cobrados */
  claimedObjectives: string[];
  /** Edad del jugador (años). */
  ageYears: number;
  /** Temporada actual (1-based). */
  season: number;
  /** Semana dentro de la temporada (0 .. maxTurns-1). */
  weekInSeason: number;
  /** Billetera real: no se clampea a 100. */
  cash: number;
  /** Ítems de setup comprados. */
  ownedItems: string[];
  /** Sede actual en el city strip. */
  venueId: VenueId;
  /** Wins de la temporada en curso (para el resumen). */
  seasonWins: number;
  /** Losses de la temporada en curso. */
  seasonLosses: number;
}
