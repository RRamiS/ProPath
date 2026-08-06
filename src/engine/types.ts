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

export type WeekActivityId = 'soloq' | 'scrim' | 'vod' | 'rest' | 'content' | 'match';

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
  /** Por qué elegir este rol importa: riesgo / identidad. */
  stakes: string;
  /** Stats que crecen más fuerte on-role. */
  primaryStats: StatId[];
  /** Llamadas de partido donde este rol brilla. */
  signatureCalls: string[];
  /** Actividad semanal que más te define. */
  signatureActivity: WeekActivityId;
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

/** La semana se juega en dos bloques: lo que hacés de día y lo que hacés de noche. */
export type Daypart = 'day' | 'night';

/** Sedes del mapa: cada una abre una habitación distinta. */
export type VenueId = 'home' | 'gym' | 'cafe' | 'academy' | 'arena';

export interface GameEvent {
  id: string;
  title: string;
  body: string;
  stages: string[];
  nationTags?: string[];
  excludeNationTags?: string[];
  /** Preferir si la última actividad fue esta */
  activityTags?: WeekActivityId[];
  /** Si está seteado, solo aplica a estos roleIds (mid/jungle/adc/…). */
  roleTags?: string[];
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

export type RelationKey = 'coach' | 'duo' | 'rival' | 'manager';

export interface Relations {
  coach: number;
  duo: number;
  rival: number;
  manager: number;
}

export type NpcMood = 'calm' | 'tense' | 'warm' | 'cold' | 'urgent';
export type WeatherId = 'clear' | 'rain' | 'heat' | 'fog';
export type ThreadKind =
  | 'contract'
  | 'starting_spot'
  | 'rivalry'
  | 'burnout'
  | 'sponsor'
  | 'roster_rift';

export interface RosterMember {
  id: RelationKey;
  name: string;
  role: string;
  blurb: string;
}

export interface PersistedRoster {
  coach: RosterMember;
  duo: RosterMember;
  rival: RosterMember;
  manager: RosterMember;
}

export type NpcActionId = 'invite' | 'avoid' | 'claim' | 'offer' | 'leak';

export interface NpcState {
  kind: RelationKey;
  venueId: VenueId;
  mood: NpcMood;
  energy: number;
  agenda: string;
  trust: number;
  lastMetTurn: number;
  urgency: number;
  /** Acción autónoma pendiente (se resuelve al hablar o al avanzar semana). */
  pendingAction: NpcActionId | null;
}

export interface MemoryEntry {
  archetypeId: string;
  instanceId: string;
  actors: RelationKey[];
  choiceId: string | null;
  turn: number;
  stage: string;
  outcome: string;
  intensity: number;
  cause?: string;
  venueId?: VenueId;
}

export interface NarrativeThread {
  id: string;
  kind: ThreadKind;
  actors: RelationKey[];
  intensity: number;
  openedTurn: number;
  lastBeatTurn: number;
  flags: Record<string, string | number | boolean>;
}

export interface WorldClock {
  weather: WeatherId;
  crowd: number;
  ambience: string;
}

/** Verbo gráfico con el que se resuelve la situación en escena. */
export type SituationVerb = 'talk' | 'sort' | 'timing' | 'choice';

export interface SituationChoice {
  id: string;
  label: string;
  hint?: string;
  verb: SituationVerb;
  effect: ChoiceEffect;
  /** Deltas relativos a los actores materializados, resueltos al instanciar. */
  actorRelations?: {
    primary?: number;
    others?: number;
  };
  /** Texto de resolución tras elegir. */
  outcome?: string;
}

export interface SituationArchetype {
  id: string;
  family: 'legacy' | 'roster' | 'sponsor' | 'performance';
  titleTemplate: string;
  bodyTemplate: string;
  stages: string[];
  nationTags?: string[];
  excludeNationTags?: string[];
  activityTags?: WeekActivityId[];
  /** Si está seteado, solo aplica a estos roleIds. */
  roleTags?: string[];
  requireRelations?: Partial<Relations>;
  actors: RelationKey[];
  venues?: VenueId[];
  causes: string[];
  weight?: number;
  cooldownTurns?: number;
  actorCooldownTurns?: number;
  choices: SituationChoice[];
  minigame?: EventMinigame;
  threadKind?: ThreadKind;
}

export interface SituationInstance {
  instanceId: string;
  archetypeId: string;
  family: SituationArchetype['family'];
  title: string;
  body: string;
  actors: RelationKey[];
  cause: string;
  venueId: VenueId;
  choices: SituationChoice[];
  minigame?: EventMinigame;
  threadKind?: ThreadKind;
  visual: {
    accent: 'blue' | 'gold' | 'warn' | 'danger' | 'accent' | 'violet';
    propHint: string;
  };
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
  /** IDs de arquetipo recientes (compat + anti-repeat rápido). */
  history: string[];
  currentEventId: string | null;
  /** Situación materializada actual (storylet instanciado). */
  currentSituation: SituationInstance | null;
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
  /** Roster con nombres reales persistidos. */
  roster: PersistedRoster;
  npcStates: Record<RelationKey, NpcState>;
  memories: MemoryEntry[];
  activeThreads: NarrativeThread[];
  worldClock: WorldClock;
  /** Maestría 0–100 por rol. Define bonus de partido y training. */
  roleMastery: Record<string, number>;
  /** Rol anterior tras un switch (narrativa / UI). */
  previousRoleId: string | null;
  /** Cuántas veces cambiaste de carril en la carrera. */
  roleSwitches: number;
  /** Semanas restantes antes de otro switch (0 = libre en season break). */
  roleSwitchCooldown: number;
}
