/**
 * City strip: pocas sedes con peso (Kingdom), cada una abre un room.
 */
import { contextualNpcLine, npcSpawnsFromState } from './npcDirector';
import type { CareerState, RelationKey, VenueId, WeekActivityId } from './types';

export interface VenueDef {
  id: VenueId;
  label: string;
  blurb: string;
  activities: WeekActivityId[];
  npcs: Array<'coach' | 'duo' | 'rival' | 'manager'>;
  order: number;
  minStageOrder?: number;
}

export const VENUES: VenueDef[] = [
  {
    id: 'home',
    label: 'Tu pieza',
    blurb: 'Setup, cama, cámara. El hub de siempre.',
    activities: ['soloq', 'vod', 'rest', 'content'],
    npcs: ['duo'],
    order: 0,
  },
  {
    id: 'gym',
    label: 'Gym',
    blurb: 'Cuerpo primero. Baja fatiga, sube cabeza.',
    activities: ['rest'],
    npcs: [],
    order: 1,
  },
  {
    id: 'cafe',
    label: 'Café',
    blurb: 'Charlas con el círculo. Relaciones.',
    activities: ['content'],
    npcs: ['duo', 'rival', 'manager'],
    order: 2,
  },
  {
    id: 'academy',
    label: 'Academia',
    blurb: 'Scrims, pizarra, VOD con el coach.',
    activities: ['scrim', 'vod'],
    npcs: ['coach', 'duo'],
    order: 3,
    minStageOrder: 2,
  },
  {
    id: 'arena',
    label: 'Arena',
    blurb: 'Match day. Luces, draft, público.',
    activities: ['match'],
    npcs: ['coach', 'rival'],
    order: 4,
    minStageOrder: 2,
  },
];

export function getVenue(id: VenueId): VenueDef {
  return VENUES.find((v) => v.id === id) ?? VENUES[0]!;
}

export function availableVenues(stageOrder: number): VenueDef[] {
  return VENUES.filter((v) => (v.minStageOrder ?? 0) <= stageOrder).sort(
    (a, b) => a.order - b.order
  );
}

export function venueAllows(venueId: VenueId, activityId: WeekActivityId): boolean {
  return getVenue(venueId).activities.includes(activityId);
}

/**
 * Viajar cuesta fatiga leve, no un bloque entero.
 * El tiempo importa sin trabar el planner de día/noche.
 */
export function travelTo(state: CareerState, venueId: VenueId): CareerState {
  if (state.venueId === venueId) return state;
  const venue = getVenue(venueId);
  return {
    ...state,
    venueId,
    fatigue: Math.min(100, state.fatigue + 2),
    lastNotice: `Viajaste a ${venue.label}.`,
    ticker: [`VIAJE · ${venue.label}`, ...state.ticker],
    phase: 'hub',
    currentEventId: null,
    currentSituation: null,
  };
}

export interface NpcSpawn {
  kind: RelationKey;
  /** Coordenadas de piso en unidades de habitación (-5..5) */
  fx: number;
  fy: number;
  mood?: string;
  urgency?: number;
  name?: string;
}

export function npcSpawns(state: CareerState): NpcSpawn[] {
  return npcSpawnsFromState(state);
}

export const NPC_LINES: Record<NpcSpawn['kind'], { day: string[]; night: string[] }> = {
  coach: {
    day: [
      'Marek: "Hoy laburamos el side lane. Sin excusas."',
      'Marek: "Vi tu SoloQ. Dejá de forzar."',
    ],
    night: [
      'Marek: "Descansá. Mañana hay review."',
      'Marek: "Si seguís así de fatigado, te saco del starting."',
    ],
  },
  duo: {
    day: [
      'Duo: "¿Rankeds juntos o café primero?"',
      'Duo: "El rival está tilteado. Buen momento."',
    ],
    night: [
      'Duo: "Una más y dormimos. Posta."',
      'Duo: "Vi un clip tuyo. Estás on fire."',
    ],
  },
  rival: {
    day: [
      'Rival: "Nos vemos en la serie. No me falles."',
      'Rival: "Los scouts hablan de los dos. Solo uno queda."',
    ],
    night: [
      'Rival: "Dormí. Quiero ganarte en forma."',
      'Rival: "Tu último draft fue predecible."',
    ],
  },
  manager: {
    day: [
      'Manager: "Hay un sponsor mirando. No rompas nada."',
      'Manager: "Contenido esta semana = bonus."',
    ],
    night: [
      'Manager: "Te conseguí una nota. No digas boludeces."',
      'Manager: "El contrato se renueva si hay resultados."',
    ],
  },
};

export function npcLine(
  kind: NpcSpawn['kind'],
  daypart: 'day' | 'night',
  seed: number,
  state?: CareerState
): string {
  if (state) return contextualNpcLine(state, kind);
  const pool = NPC_LINES[kind][daypart];
  return pool[seed % pool.length]!;
}
