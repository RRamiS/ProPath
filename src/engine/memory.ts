import type {
  CareerState,
  MemoryEntry,
  NarrativeThread,
  RelationKey,
  ThreadKind,
} from './types';

export const MAX_MEMORIES = 48;

export function pushMemory(state: CareerState, entry: MemoryEntry): CareerState {
  const memories = [...state.memories, entry].slice(-MAX_MEMORIES);
  const history = [...state.history, entry.archetypeId].slice(-24);
  return { ...state, memories, history };
}

export function recentArchetypes(state: CareerState, window = 10): Set<string> {
  return new Set(state.memories.slice(-window).map((m) => m.archetypeId));
}

export function turnsSinceArchetype(state: CareerState, archetypeId: string): number {
  for (let i = state.memories.length - 1; i >= 0; i--) {
    const m = state.memories[i]!;
    if (m.archetypeId === archetypeId) return state.turn - m.turn;
  }
  return 999;
}

export function turnsSinceActorPair(
  state: CareerState,
  archetypeId: string,
  actors: RelationKey[]
): number {
  const key = actors.slice().sort().join(',');
  for (let i = state.memories.length - 1; i >= 0; i--) {
    const m = state.memories[i]!;
    if (m.archetypeId !== archetypeId) continue;
    if (m.actors.slice().sort().join(',') === key) return state.turn - m.turn;
  }
  return 999;
}

export function upsertThread(
  state: CareerState,
  kind: ThreadKind,
  actors: RelationKey[],
  intensityDelta: number,
  extraFlags?: NarrativeThread['flags']
): CareerState {
  const existing = state.activeThreads.find(
    (t) => t.kind === kind && t.actors.join(',') === actors.join(',')
  );
  if (existing) {
    const activeThreads = state.activeThreads.map((t) =>
      t.id === existing.id
        ? {
            ...t,
            intensity: Math.max(0, Math.min(100, t.intensity + intensityDelta)),
            lastBeatTurn: state.turn,
            flags: { ...t.flags, ...(extraFlags ?? {}) },
          }
        : t
    );
    return {
      ...state,
      activeThreads: activeThreads.filter((t) => t.intensity > 0),
    };
  }
  if (intensityDelta <= 0) return state;
  const thread: NarrativeThread = {
    id: `${kind}_${actors.join('_')}_${state.turn}`,
    kind,
    actors,
    intensity: Math.min(100, intensityDelta),
    openedTurn: state.turn,
    lastBeatTurn: state.turn,
    flags: { ...(extraFlags ?? {}) },
  };
  return { ...state, activeThreads: [...state.activeThreads, thread] };
}

export function decayThreads(state: CareerState): CareerState {
  const activeThreads = state.activeThreads
    .map((t) => {
      const age = state.turn - t.lastBeatTurn;
      const decay = age >= 4 ? 8 : age >= 2 ? 3 : 0;
      return { ...t, intensity: Math.max(0, t.intensity - decay) };
    })
    .filter((t) => t.intensity > 0);
  return { ...state, activeThreads };
}

export function memorySummary(state: CareerState, limit = 5): string[] {
  return state.memories
    .slice(-limit)
    .reverse()
    .map((m) => `${m.archetypeId}:${m.outcome}`);
}

/** Última memoria con ese actor (para callbacks de diálogo). */
export function lastMemoryWithActor(
  state: CareerState,
  kind: RelationKey
): MemoryEntry | undefined {
  for (let i = state.memories.length - 1; i >= 0; i--) {
    const m = state.memories[i]!;
    if (m.actors.includes(kind) && m.outcome.trim()) return m;
  }
  return undefined;
}

/** Una línea humana para UI de talk (null si no hay historial). */
export function talkMemoryCallback(
  state: CareerState,
  kind: RelationKey
): string | null {
  const mem = lastMemoryWithActor(state, kind);
  if (!mem) return null;
  const name = state.roster[kind]?.name ?? kind;
  const snip =
    mem.outcome.length > 64 ? `${mem.outcome.slice(0, 61)}…` : mem.outcome;
  return `${name} no olvidó: ${snip}`;
}
