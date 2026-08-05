/**
 * Economía gastable: la plata es un número real, no un stat 0–100.
 * Comprar se ve en el cuarto (lección YouTubers Life).
 */
import type { CareerState, VenueId } from './types';

export interface ShopItem {
  id: string;
  label: string;
  blurb: string;
  cost: number;
  /** Qué prop mejora visualmente */
  visual: 'monitor' | 'chair' | 'glow' | 'banner' | 'desk';
  /** Bonus pasivo leve al tenerlo */
  soloqMechanics?: number;
  restFatigue?: number;
}

export const SHOP_CATALOG: ShopItem[] = [
  {
    id: 'monitor_pro',
    label: 'Monitor ultrawide',
    blurb: 'Más espacio de mapa. Se ve en el setup.',
    cost: 140,
    visual: 'monitor',
    soloqMechanics: 1,
  },
  {
    id: 'chair_ergo',
    label: 'Silla pro',
    blurb: 'La espalda aguanta el grind nocturno.',
    cost: 90,
    visual: 'chair',
    restFatigue: -2,
  },
  {
    id: 'keyboard_mech',
    label: 'Teclado mech',
    blurb: 'Clicky. SoloQ rinde un toque más.',
    cost: 70,
    visual: 'desk',
    soloqMechanics: 1,
  },
  {
    id: 'rgb_kit',
    label: 'Kit RGB',
    blurb: 'Cosmético puro. Tu pieza se ve cara.',
    cost: 45,
    visual: 'glow',
  },
  {
    id: 'wall_banner',
    label: 'Banner del roster',
    blurb: 'Cuelga en la pared. Marca presencia.',
    cost: 110,
    visual: 'banner',
  },
];

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_CATALOG.find((i) => i.id === id);
}

export function ownsItem(state: CareerState, id: string): boolean {
  return state.ownedItems.includes(id);
}

/** Alquiler semanal según sede / etapa. */
export function weeklyRent(state: CareerState): number {
  const order =
    state.stageId === 'worlds'
      ? 5
      : state.stageId === 'tier1'
        ? 4
        : state.stageId === 'challengers'
          ? 3
          : state.stageId === 'academy'
            ? 2
            : 1;
  const base = 8 + order * 6;
  if (state.venueId === 'academy' || state.venueId === 'arena') return Math.round(base * 0.5);
  return base;
}

export function setupBonuses(state: CareerState) {
  let soloqMechanics = 0;
  let restFatigue = 0;
  for (const id of state.ownedItems) {
    const item = getShopItem(id);
    if (!item) continue;
    soloqMechanics += item.soloqMechanics ?? 0;
    restFatigue += item.restFatigue ?? 0;
  }
  return { soloqMechanics, restFatigue };
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
    lastNotice: `Compraste ${item.label}. −$${item.cost}`,
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
