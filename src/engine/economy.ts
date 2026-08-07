/**
 * Economía gastable: la plata es un número real, no un stat 0–100.
 * Comprar se ve en el cuarto y pesa en SoloQ / descanso / partidos.
 */
import type { CareerState, VenueId } from './types';

export interface ShopItem {
  id: string;
  label: string;
  blurb: string;
  /** Línea corta para la UI del shop (qué hace de verdad). */
  payoff: string;
  cost: number;
  /** Qué prop mejora visualmente */
  visual: 'monitor' | 'chair' | 'glow' | 'banner' | 'desk';
  soloqMechanics?: number;
  restFatigue?: number;
  restForm?: number;
  matchEdge?: number;
  contentCash?: number;
}

export const SHOP_CATALOG: ShopItem[] = [
  {
    id: 'monitor_pro',
    label: 'Monitor ultrawide',
    blurb: 'Más espacio de mapa. Se ve en el setup.',
    payoff: 'SoloQ +2 mec · partido +edge',
    cost: 140,
    visual: 'monitor',
    soloqMechanics: 2,
    matchEdge: 0.18,
  },
  {
    id: 'chair_ergo',
    label: 'Silla pro',
    blurb: 'La espalda aguanta el grind nocturno.',
    payoff: 'Descanso −4 fatiga · +2 forma',
    cost: 90,
    visual: 'chair',
    restFatigue: -4,
    restForm: 2,
  },
  {
    id: 'keyboard_mech',
    label: 'Teclado mech',
    blurb: 'Clicky. SoloQ rinde un toque más.',
    payoff: 'SoloQ +2 mecánicas',
    cost: 70,
    visual: 'desk',
    soloqMechanics: 2,
  },
  {
    id: 'rgb_kit',
    label: 'Kit RGB',
    blurb: 'La pieza se ve cara — y el stream también.',
    payoff: 'Contenido +$12',
    cost: 45,
    visual: 'glow',
    contentCash: 12,
  },
  {
    id: 'wall_banner',
    label: 'Banner del roster',
    blurb: 'Cuelga en la pared. Marca presencia.',
    payoff: 'Partido +edge leve',
    cost: 110,
    visual: 'banner',
    matchEdge: 0.12,
  },
];

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_CATALOG.find((i) => i.id === id);
}

export function ownsItem(state: CareerState, id: string): boolean {
  return state.ownedItems.includes(id);
}

function stageOrder(state: CareerState): number {
  return state.stageId === 'worlds'
    ? 5
    : state.stageId === 'tier1'
      ? 4
      : state.stageId === 'challengers'
        ? 3
        : state.stageId === 'academy'
          ? 2
          : 1;
}

/** Alquiler semanal según sede / etapa. */
export function weeklyRent(state: CareerState): number {
  const order = stageOrder(state);
  const base = 10 + order * 7;
  if (state.venueId === 'academy' || state.venueId === 'arena') return Math.round(base * 0.5);
  return base;
}

/** Comida / living semanal (siempre se suma al alquiler). */
export function weeklyFood(state: CareerState): number {
  return 6 + stageOrder(state) * 2;
}

export function weeklyLivingCost(state: CareerState): {
  rent: number;
  food: number;
  total: number;
} {
  const rent = weeklyRent(state);
  const food = weeklyFood(state);
  return { rent, food, total: rent + food };
}

/** Costo de viaje a una sede (volver a casa es gratis). */
export function travelFare(venueId: VenueId): number {
  switch (venueId) {
    case 'home':
      return 0;
    case 'arena':
      return 5;
    case 'gym':
      return 6;
    case 'cafe':
      return 8;
    case 'academy':
      return 10;
    default:
      return 6;
  }
}

export function canTravel(state: CareerState, venueId: VenueId): {
  ok: boolean;
  cost: number;
  reason?: string;
} {
  if (state.venueId === venueId) return { ok: true, cost: 0 };
  const cost = travelFare(venueId);
  if (cost <= 0) return { ok: true, cost: 0 };
  if (state.cash < cost) {
    return {
      ok: false,
      cost,
      reason: `Necesitás $${cost} para viajar. Contenido o un win te sacan del pozo.`,
    };
  }
  return { ok: true, cost };
}

export function setupBonuses(state: CareerState) {
  let soloqMechanics = 0;
  let restFatigue = 0;
  let restForm = 0;
  let matchEdge = 0;
  let contentCash = 0;
  for (const id of state.ownedItems) {
    const item = getShopItem(id);
    if (!item) continue;
    soloqMechanics += item.soloqMechanics ?? 0;
    restFatigue += item.restFatigue ?? 0;
    restForm += item.restForm ?? 0;
    matchEdge += item.matchEdge ?? 0;
    contentCash += item.contentCash ?? 0;
  }
  return { soloqMechanics, restFatigue, restForm, matchEdge, contentCash };
}

export function canAfford(state: CareerState, itemId: string): boolean {
  const item = getShopItem(itemId);
  if (!item) return false;
  if (ownsItem(state, itemId)) return false;
  return state.cash >= item.cost;
}

export function buyItem(state: CareerState, itemId: string): CareerState | null {
  const item = getShopItem(itemId);
  if (!item || ownsItem(state, itemId) || state.cash < item.cost) return null;
  return {
    ...state,
    cash: state.cash - item.cost,
    ownedItems: [...state.ownedItems, itemId],
    lastNotice: `Compraste ${item.label}. −$${item.cost} · ${item.payoff}`,
    ticker: [`SHOP · ${item.label}`, ...state.ticker],
  };
}

/** Ingreso de cash sin tocar el stat clampado. */
export function addCash(state: CareerState, amount: number, notice?: string): CareerState {
  if (amount === 0) return state;
  const cash = Math.max(0, Math.round(state.cash + amount));
  return {
    ...state,
    cash,
    lastNotice: notice ?? state.lastNotice,
  };
}

/** Nivel visual del setup (0–3) para el arte del cuarto. */
export function setupTier(state: CareerState): number {
  const n = state.ownedItems.length;
  if (n >= 4) return 3;
  if (n >= 2) return 2;
  if (n >= 1) return 1;
  return 0;
}

export function hasVisual(state: CareerState, visual: ShopItem['visual']): boolean {
  return state.ownedItems.some((id) => getShopItem(id)?.visual === visual);
}

export const VENUE_RENT_HINT: Record<VenueId, string> = {
  home: 'Tu pieza',
  gym: 'Gym',
  cafe: 'Café',
  academy: 'Academia',
  arena: 'Arena',
};
