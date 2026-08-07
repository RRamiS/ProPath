/**
 * Persistencia local de la carrera activa.
 * Un slot: al cerrar la app podés continuar desde el hub.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CareerState } from '../engine/types';

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

export async function loadSave(): Promise<SavePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavePayload;
    if (!data?.career?.profile?.name || data.version !== 1) return null;
    return data;
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
  // No guardamos partida terminada como "continuar" jugable — sí como historial corto.
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
