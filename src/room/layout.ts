/**
 * Layout del diorama. Las posiciones NO se escriben a mano: salen del render
 * de Blender (`roomManifest.generated.ts`), así el recorte de cada prop cae
 * exactamente donde estaba en la escena 3D.
 */
import type { VenueId } from '../engine/types';
import { ROOM_PLACEMENT, type RoomPlacement } from './roomManifest.generated';

export type PropId =
  | 'rig'
  | 'board'
  | 'tv'
  | 'bed'
  | 'cam'
  | 'door'
  | 'window'
  | 'shelf'
  | 'banner'
  | 'poster'
  | 'rug';

export interface PropSpec {
  id: PropId;
  /** Porcentajes sobre la caja de la escena */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Coordenadas de piso en unidades de habitación (-5..5) */
  fx: number;
  fy: number;
  z: number;
  plane: 'wall' | 'floor';
  minStageOrder?: number;
}

/** Props que abren una actividad; el resto es ambientación. */
const ACTION_IDS: PropId[] = ['rig', 'board', 'tv', 'bed', 'cam', 'door'];

const STAGE_GATE: Partial<Record<PropId, number>> = {
  shelf: 3,
  banner: 4,
};

const VENUE_NAMES: Record<VenueId, string> = {
  home: 'Tu pieza',
  gym: 'Gym',
  cafe: 'Café',
  academy: 'Academia',
  arena: 'Arena',
};

function toSpecs(placement: RoomPlacement): PropSpec[] {
  return placement.props.map((p) => ({
    id: p.id as PropId,
    left: p.x * 100,
    top: p.y * 100,
    width: p.w * 100,
    height: p.h * 100,
    fx: p.pos[0],
    fy: p.pos[1],
    z: p.z,
    plane: p.plane,
    minStageOrder: STAGE_GATE[p.id as PropId],
  }));
}

export interface VenueLayout {
  actions: PropSpec[];
  decor: PropSpec[];
  all: PropSpec[];
  placement: RoomPlacement;
  name: string;
}

const CACHE = new Map<VenueId, VenueLayout>();

export function venueLayout(venueId: VenueId): VenueLayout {
  const cached = CACHE.get(venueId);
  if (cached) return cached;

  const placement = ROOM_PLACEMENT[venueId] ?? ROOM_PLACEMENT.home!;
  const all = toSpecs(placement);
  const layout: VenueLayout = {
    all,
    actions: all.filter((s) => ACTION_IDS.includes(s.id)),
    decor: all.filter((s) => !ACTION_IDS.includes(s.id)),
    placement,
    name: VENUE_NAMES[venueId] ?? VENUE_NAMES.home,
  };
  CACHE.set(venueId, layout);
  return layout;
}

/** Convierte coordenadas de piso (unidades de habitación) a % de la escena. */
export function floorToScreen(venueId: VenueId, fx: number, fy: number) {
  const { floor } = venueLayout(venueId).placement;
  const clampedX = Math.max(-floor.half, Math.min(floor.half, fx));
  const clampedY = Math.max(-floor.half, Math.min(floor.half, fy));
  return {
    x: (floor.origin[0] + floor.ux[0] * clampedX + floor.uy[0] * clampedY) * 100,
    y: (floor.origin[1] + floor.ux[1] * clampedX + floor.uy[1] * clampedY) * 100,
  };
}

/** Punto de piso frente a un prop, para que el avatar camine hasta ahí. */
export function standingSpot(spec: PropSpec) {
  const pull = 1.5;
  const len = Math.hypot(spec.fx, spec.fy) || 1;
  return {
    fx: spec.fx - (spec.fx / len) * pull,
    fy: spec.fy - (spec.fy / len) * pull,
  };
}

export function propById(id: string, venueId: VenueId = 'home'): PropSpec | undefined {
  return venueLayout(venueId).all.find((p) => p.id === id);
}

export const ROOM_NAMES: Record<string, string> = {
  soloq: 'Tu pieza',
  academy: 'Cuarto de academia',
  challengers: 'Depto del roster',
  tier1: 'Gaming house',
  worlds: 'Suite del torneo',
};
