/**
 * Persistencia local de la carrera activa.
 * Un slot: al cerrar la app podés continuar desde el hub.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildRoster, DEFAULT_RELATIONS } from '../content/esports/roster';
import { initialNpcStates } from '../engine/npcDirector';
import type {
  CareerState,
  Daypart,
  NpcState,
  RelationKey,
  Relations,
  VenueId,
} from '../engine/types';

const KEY = 'propath.save.v1';

export type SaveScreen =
  | 'weekHub'
  | 'play'
  | 'match'
  | 'seasonBreak'
  | 'shop'
  | 'city'
  | 'ending';

export type SavePayload = {
  version: 1;
  savedAt: number;
  career: CareerState;
  screen: SaveScreen;
  matchPhase: 'live' | 'result';
};

export type SaveSummary = {
  name: string;
  stageId: string;
  weekInSeason: number;
  maxTurns: number;
  season: number;
  wins: number;
  losses: number;
  cash: number;
  savedAt: number;
  ending: boolean;
};

function isSaveScreen(s: string): s is SaveScreen {
  return (
    s === 'weekHub' ||
    s === 'play' ||
    s === 'match' ||
    s === 'seasonBreak' ||
    s === 'shop' ||
    s === 'city' ||
    s === 'ending'
  );
}

export function toSaveScreen(screen: string): SaveScreen {
  return isSaveScreen(screen) ? screen : 'weekHub';
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function clamp01(n: unknown, fallback: number): number {
  const x = typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function normalizeRelations(raw: unknown): Relations {
  const r = (raw ?? {}) as Partial<Relations>;
  return {
    coach: clamp01(r.coach, DEFAULT_RELATIONS.coach),
    duo: clamp01(r.duo, DEFAULT_RELATIONS.duo),
    rival: clamp01(r.rival, DEFAULT_RELATIONS.rival),
    manager: clamp01(r.manager, DEFAULT_RELATIONS.manager),
  };
}

function normalizeNpcStates(
  raw: unknown,
  relations: Relations
): Record<RelationKey, NpcState> {
  const base = initialNpcStates(relations);
  const src = (raw ?? {}) as Partial<Record<RelationKey, Partial<NpcState>>>;
  const kinds: RelationKey[] = ['coach', 'duo', 'rival', 'manager'];
  const out = { ...base };
  for (const kind of kinds) {
    const prev = src[kind];
    if (!prev || typeof prev !== 'object') continue;
    out[kind] = {
      ...base[kind],
      ...prev,
      kind,
      venueId: (prev.venueId as VenueId) ?? base[kind].venueId,
      mood: prev.mood ?? base[kind].mood,
      energy: clamp01(prev.energy, base[kind].energy),
      urgency: clamp01(prev.urgency, base[kind].urgency),
      agenda: typeof prev.agenda === 'string' ? prev.agenda : base[kind].agenda,
      pendingAction: prev.pendingAction ?? null,
      lastMetTurn:
        typeof prev.lastMetTurn === 'number' ? prev.lastMetTurn : base[kind].lastMetTurn,
    };
  }
  return out;
}

const VENUES: VenueId[] = ['home', 'gym', 'cafe', 'academy', 'arena'];
const DAYPARTS: Daypart[] = ['day', 'night'];

/**
 * Rellena campos que el código asume siempre presentes.
 * Saves viejos / parciales no deben crashear al Continuar.
 */
export function normalizeCareer(raw: CareerState): CareerState | null {
  if (!raw?.profile?.name || !raw.profile.nationId || !raw.profile.roleId) {
    return null;
  }

  const nationId = raw.profile.nationId;
  const roleId = raw.profile.roleId;
  const relations = normalizeRelations(raw.relations);
  const roster =
    raw.roster?.coach?.name && raw.roster?.rival?.name
      ? raw.roster
      : buildRoster(nationId, roleId);
  const npcStates = normalizeNpcStates(raw.npcStates, relations);
  const venueId = VENUES.includes(raw.venueId) ? raw.venueId : 'home';
  const daypart = DAYPARTS.includes(raw.daypart) ? raw.daypart : 'day';
  const wc = raw.worldClock;

  return {
    ...raw,
    profile: {
      ...raw.profile,
      name: String(raw.profile.name).trim() || 'Prodigy',
      durationId: raw.profile.durationId ?? raw.durationId ?? 'season',
    },
    stats: raw.stats ?? {},
    flags: raw.flags && typeof raw.flags === 'object' ? raw.flags : {},
    history: asArray(raw.history),
    ticker: asArray(raw.ticker),
    claimedObjectives: asArray(raw.claimedObjectives),
    ownedItems: asArray(raw.ownedItems),
    memories: asArray(raw.memories),
    activeThreads: asArray(raw.activeThreads),
    relations,
    roster,
    npcStates,
    venueId,
    daypart,
    cash: Math.max(0, Math.round(Number(raw.cash) || 0)),
    form: clamp01(raw.form, 55),
    fatigue: clamp01(raw.fatigue, 30),
    wins: Math.max(0, Math.round(Number(raw.wins) || 0)),
    losses: Math.max(0, Math.round(Number(raw.losses) || 0)),
    seasonWins: Math.max(0, Math.round(Number(raw.seasonWins) || 0)),
    seasonLosses: Math.max(0, Math.round(Number(raw.seasonLosses) || 0)),
    season: Math.max(1, Math.round(Number(raw.season) || 1)),
    weekInSeason: Math.max(0, Math.round(Number(raw.weekInSeason) || 0)),
    turn: Math.max(0, Math.round(Number(raw.turn) || 0)),
    maxTurns: Math.max(1, Math.round(Number(raw.maxTurns) || 12)),
    ageYears: Math.max(16, Math.round(Number(raw.ageYears) || 18)),
    roleMastery:
      raw.roleMastery && typeof raw.roleMastery === 'object'
        ? raw.roleMastery
        : { [roleId]: 22 },
    previousRoleId: raw.previousRoleId ?? null,
    roleSwitches: Math.max(0, Math.round(Number(raw.roleSwitches) || 0)),
    roleSwitchCooldown: Math.max(0, Math.round(Number(raw.roleSwitchCooldown) || 0)),
    worldClock:
      wc && typeof wc === 'object'
        ? {
            weather: wc.weather ?? 'clear',
            crowd: clamp01(wc.crowd, 30),
            ambience: typeof wc.ambience === 'string' ? wc.ambience : 'Día de grind.',
          }
        : { weather: 'clear', crowd: 30, ambience: 'Día de grind.' },
    currentEventId: raw.currentEventId ?? null,
    currentSituation: raw.currentSituation ?? null,
    endingId: raw.endingId ?? null,
    lastNotice: raw.lastNotice ?? null,
    lastActivity: raw.lastActivity ?? null,
    lastMatch: raw.lastMatch ?? null,
    phase: raw.phase ?? 'hub',
    stageId: raw.stageId || 'soloq',
    durationId: raw.durationId ?? raw.profile.durationId ?? 'season',
    packId: raw.packId || 'esports',
    rngSeed: typeof raw.rngSeed === 'number' ? raw.rngSeed : Date.now() >>> 0,
  };
}

export async function loadSave(): Promise<SavePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavePayload;
    if (!data?.career?.profile?.name || data.version !== 1) return null;
    const career = normalizeCareer(data.career);
    if (!career) return null;
    return {
      version: 1,
      savedAt: typeof data.savedAt === 'number' ? data.savedAt : Date.now(),
      career,
      screen: toSaveScreen(String(data.screen ?? 'weekHub')),
      matchPhase: data.matchPhase === 'result' ? 'result' : 'live',
    };
  } catch {
    return null;
  }
}

export function summarizeSave(save: SavePayload): SaveSummary {
  const c = save.career;
  return {
    name: c.profile.name,
    stageId: c.stageId,
    weekInSeason: c.weekInSeason,
    maxTurns: c.maxTurns,
    season: c.season,
    wins: c.wins,
    losses: c.losses,
    cash: c.cash,
    savedAt: save.savedAt,
    ending: !!c.endingId,
  };
}

export async function saveGame(payload: Omit<SavePayload, 'version' | 'savedAt'>): Promise<void> {
  const body: SavePayload = {
    version: 1,
    savedAt: Date.now(),
    career: payload.career,
    screen: payload.screen,
    matchPhase: payload.matchPhase,
  };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(body));
  } catch {
    /* disco lleno / privado — silencio */
  }
}

export async function clearSave(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
