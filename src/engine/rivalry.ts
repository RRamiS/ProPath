import { upsertThread } from './memory';
import type { CareerState, NarrativeThread } from './types';

/** Heat mínimo para customs / showdown (alcanzable en Academy / sprint). */
export const RIVAL_CUSTOMS_HEAT = 30;
export const RIVAL_SHOWDOWN_HEAT = 50;
/** Tras pactar customs, el hilo queda listo para el cara a cara. */
export const RIVAL_POST_CUSTOMS_HEAT = 55;

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

export function isShowdownLost(state: CareerState): boolean {
  return Number(state.flags.rivalShowdownLost ?? 0) === 1;
}

/** Sube el heat del hilo a un piso (sin bajar si ya está más alto). */
export function ensureRivalryHeat(state: CareerState, minHeat: number): CareerState {
  const heat = rivalryHeat(state);
  if (heat >= minHeat) return state;
  return upsertThread(state, 'rivalry', ['rival'], minHeat - heat);
}

/** Etiqueta corta para el chip del HUD. */
export function rivalryHudLabel(state: CareerState): string | null {
  const heat = rivalryHeat(state);
  if (heat < 30 && !isShowdownPending(state)) return null;
  if (isShowdownPending(state)) return `SHOWDOWN vs ${state.roster.rival.name}`;
  if (hasCustomsAccepted(state) && heat < RIVAL_SHOWDOWN_HEAT) {
    return 'customs hechos · falta cara a cara';
  }
  if (heat >= RIVAL_SHOWDOWN_HEAT && hasCustomsAccepted(state)) return 'cara a cara';
  if (heat >= RIVAL_CUSTOMS_HEAT) return 'customs en juego';
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

  if (
    !pending &&
    customs &&
    heat >= RIVAL_SHOWDOWN_HEAT &&
    (action === 'offer' || action === 'claim')
  ) {
    return 'rival_showdown';
  }
  if (
    !customs &&
    heat >= RIVAL_CUSTOMS_HEAT &&
    (action === 'claim' || action === 'offer' || action === 'leak')
  ) {
    return 'rival_customs';
  }
  return 'rival_probe';
}
