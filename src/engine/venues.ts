/**
 * City strip: pocas sedes con peso (Kingdom), cada una abre un room.
 */
import { contextualNpcLine, npcSpawnsFromState } from './npcDirector';
import { canTravel } from './economy';
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
    blurb: 'Pesas, fisio o descanso. El cuerpo mueve la forma. A veces el rival también.',
    activities: ['rest', 'conditioning', 'physio'],
    npcs: ['rival'],
    order: 1,
  },
  {
    id: 'cafe',
    label: 'Café',
    blurb: 'Mesa con gente de día; contenido cuando quieras. El círculo vive acá.',
    activities: ['hangout', 'content'],
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

const TRAVEL_FLAVOR: Record<VenueId, string[]> = {
  home: [
    'La silla cruje al sentarte. Setup listo.',
    'Volvés a la pieza. El monitor sigue en standby.',
    'Casa: menos ruido, mismas notificaciones.',
  ],
  gym: [
    'Olor a caucho y playlist a full. El cuerpo pide lab.',
    'Entrás al gym. Alguien ya ocupó tu banco favorito.',
    'Pesas, espejos, cero drafts. Solo forma.',
  ],
  cafe: [
    'El barista ya sabe tu orden. Mesa del rincón libre.',
    'Café: gente del circuito, rumor a media voz.',
    'Entrá. El rival a veces mira desde la ventana.',
  ],
  academy: [
    'Pizarra, cables, olor a energy. Academia.',
    'El coach ya está con el clipboard. Scrim o VOD.',
    'Pasillo de booths. Alguien grita un call en la sala B.',
  ],
  arena: [
    'Luces frías. Hoy el mapa se juega en serio.',
    'Arena: público, cámaras, presión de verdad.',
    'El draft room espera. Respirá antes de entrar.',
  ],
};

const WEATHER_TRAVEL: Record<string, { bit: string; fatigueExtra: number }> = {
  clear: { bit: '', fatigueExtra: 0 },
  rain: { bit: ' Llueve: el trayecto se siente más largo.', fatigueExtra: 1 },
  heat: { bit: ' Hace calor: el viaje pega más.', fatigueExtra: 1 },
  fog: { bit: ' Niebla en la ciudad.', fatigueExtra: 0 },
};

function travelLine(state: CareerState, venueId: VenueId): string {
  const lines = TRAVEL_FLAVOR[venueId] ?? ['Llegaste.'];
  const idx = Math.abs(state.turn + state.rngSeed + venueId.length) % lines.length;
  return lines[idx]!;
}

/**
 * Viajar cuesta fatiga leve + fare en cash (casa = gratis).
 * Sin plata: no viajás (soft lock — hacé contenido o ganá una serie).
 */
export function travelTo(state: CareerState, venueId: VenueId): CareerState {
  if (state.venueId === venueId) return state;
  const venue = getVenue(venueId);
  const check = canTravel(state, venueId);
  if (!check.ok) {
    return {
      ...state,
      lastNotice: check.reason ?? 'No podés viajar ahora.',
      ticker: ['VIAJE · SIN FONDOS', ...state.ticker],
    };
  }
  const fare = check.cost;
  const weather = WEATHER_TRAVEL[state.worldClock.weather] ?? WEATHER_TRAVEL.clear!;
  const fatigueCost = 2 + weather.fatigueExtra;
  const flavor = travelLine(state, venueId);
  const costBit =
    fare > 0 ? `−$${fare} · −${fatigueCost} fatiga.` : `−${fatigueCost} fatiga.`;
  return {
    ...state,
    venueId,
    cash: state.cash - fare,
    fatigue: Math.min(100, state.fatigue + fatigueCost),
    lastNotice: `${flavor}${weather.bit} ${costBit}`,
    ticker: [
      fare > 0 ? `VIAJE · ${venue.label} −$${fare}` : `VIAJE · ${venue.label}`,
      flavor,
      ...state.ticker,
    ].slice(0, 8),
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
