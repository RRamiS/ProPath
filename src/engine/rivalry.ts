import type { CareerState, NarrativeThread } from './types';

/** Heat del hilo de rivalidad (0 si no hay arco). */
export function rivalryHeat(state: CareerState): number {
  return state.activeThreads.find((t) => t.kind === 'rivalry')?.intensity ?? 0;
}

export function rivalryThread(state: CareerState): NarrativeThread | undefined {
  return state.activeThreads.find((t) => t.kind === 'rivalry');
}

export function hasCustomsAccepted(state: CareerState): boolean {
  const thread = rivalryThread(state);
  return (
    Number(thread?.flags.customsAccepted ?? 0) === 1 ||
    Number(state.flags.customsAccepted ?? 0) === 1
  );
}

export function isShowdownPending(state: CareerState): boolean {
  return Number(state.flags.rivalShowdownPending ?? 0) === 1;
}

export function isShowdownWon(state: CareerState): boolean {
  return Number(state.flags.rivalShowdownWon ?? 0) === 1;
}

/** Etiqueta corta para el chip del HUD. */
export function rivalryHudLabel(state: CareerState): string | null {
  const heat = rivalryHeat(state);
  if (heat < 30 && !isShowdownPending(state)) return null;
  if (isShowdownPending(state)) return `SHOWDOWN vs ${state.roster.rival.name}`;
  if (hasCustomsAccepted(state) && heat < 70) return 'customs hechos · falta cara a cara';
  if (heat >= 70) return 'cara a cara';
  if (heat >= 40) return 'customs en juego';
  return 'te mide';
}

/**
 * Qué storylet abre el rival según heat + progreso.
 * claim/offer dejan de ser siempre rival_probe.
 */
export function rivalArchetypeForAction(
  state: CareerState,
  action: 'invite' | 'avoid' | 'claim' | 'offer' | 'leak'
): string {
  if (action === 'avoid' || action === 'invite') return 'rival_probe';
  const heat = rivalryHeat(state);
  const customs = hasCustomsAccepted(state);
  const pending = isShowdownPending(state);

  if (!pending && customs && heat >= 70 && (action === 'offer' || action === 'claim')) {
    return 'rival_showdown';
  }
  if (!customs && heat >= 40 && (action === 'claim' || action === 'offer' || action === 'leak')) {
    return 'rival_customs';
  }
  return 'rival_probe';
}
