/**
 * Rangos de relación al estilo confidant: el número suelto no dice nada,
 * el rango sí, porque desbloquea un efecto concreto y visible.
 */
import type { CareerState, Relations } from './types';

export type RelationKey = keyof Relations;

/** Umbral mínimo de cada rango (índice = rango). */
export const RANK_THRESHOLDS = [0, 30, 48, 64, 78, 90];

export const MAX_RANK = RANK_THRESHOLDS.length - 1;

export interface RelationPerk {
  rank: number;
  label: string;
  detail: string;
}

export const RELATION_PERKS: Record<RelationKey, RelationPerk[]> = {
  coach: [
    { rank: 1, label: 'Feedback directo', detail: 'El lab de VOD rinde un poco más.' },
    { rank: 2, label: 'Plan de partido', detail: 'Arrancás la serie con ventaja en el draft.' },
    { rank: 3, label: 'Gestión de carga', detail: 'Perdés menos fatiga acumulada cada semana.' },
    { rank: 4, label: 'Confianza total', detail: 'El coach te banca ante la dirigencia.' },
    { rank: 5, label: 'Su proyecto sos vos', detail: 'Ventaja fuerte en cada serie.' },
  ],
  duo: [
    { rank: 1, label: 'Se entienden', detail: 'Los scrims suman más teamplay.' },
    { rank: 2, label: 'Sinergia de lane', detail: 'Mejor lectura en las peleas.' },
    { rank: 3, label: 'Te levanta', detail: 'Las derrotas te bajan menos la forma.' },
    { rank: 4, label: 'Dúo de temer', detail: 'Ventaja clara en teamfight.' },
    { rank: 5, label: 'Un solo cerebro', detail: 'El equipo juega alrededor de ustedes.' },
  ],
  rival: [
    { rank: 1, label: 'Te tiene marcado', detail: 'La prensa los compara todo el tiempo.' },
    { rank: 2, label: 'Respeto mutuo', detail: 'Ganarle a él te da más reputación.' },
    { rank: 3, label: 'Combustible', detail: 'Ganar te sube más la forma.' },
    { rank: 4, label: 'Espejo', detail: 'Aprendés de cada serie contra él.' },
    { rank: 5, label: 'La rivalidad de la era', detail: 'Cada choque es evento global.' },
  ],
  manager: [
    { rank: 1, label: 'Te contesta', detail: 'El contenido paga mejor.' },
    { rank: 2, label: 'Sponsors chicos', detail: 'Más plata por cada acción de marca.' },
    { rank: 3, label: 'Te negocia', detail: 'Mejores ofertas cuando aparecen.' },
    { rank: 4, label: 'Blindaje', detail: 'Te cubre en la crisis de prensa.' },
    { rank: 5, label: 'Socio', detail: 'Tu marca crece sola.' },
  ],
};

export const RELATION_LABELS: Record<RelationKey, string> = {
  coach: 'Coach',
  duo: 'Dúo',
  rival: 'Rival',
  manager: 'Manager',
};

export function relationRank(value: number): number {
  let rank = 0;
  for (let i = 1; i < RANK_THRESHOLDS.length; i++) {
    if (value >= RANK_THRESHOLDS[i]!) rank = i;
  }
  return rank;
}

export function unlockedPerks(kind: RelationKey, value: number): RelationPerk[] {
  const rank = relationRank(value);
  return RELATION_PERKS[kind].filter((p) => p.rank <= rank);
}

export function currentPerk(kind: RelationKey, value: number): RelationPerk | null {
  const list = unlockedPerks(kind, value);
  return list.length > 0 ? list[list.length - 1]! : null;
}

export function nextPerk(
  kind: RelationKey,
  value: number
): { perk: RelationPerk; missing: number } | null {
  const rank = relationRank(value);
  if (rank >= MAX_RANK) return null;
  const perk = RELATION_PERKS[kind].find((p) => p.rank === rank + 1);
  if (!perk) return null;
  return { perk, missing: Math.max(1, Math.ceil(RANK_THRESHOLDS[rank + 1]! - value)) };
}

/** Progreso 0-100 dentro del rango actual, para la barra. */
export function rankProgress(value: number): number {
  const rank = relationRank(value);
  if (rank >= MAX_RANK) return 100;
  const from = RANK_THRESHOLDS[rank]!;
  const to = RANK_THRESHOLDS[rank + 1]!;
  return Math.max(0, Math.min(100, ((value - from) / (to - from)) * 100));
}

/** Bonificaciones que el resto del motor consulta en vez de leer números crudos. */
export function relationBonuses(state: CareerState) {
  const coach = relationRank(state.relations.coach);
  const duo = relationRank(state.relations.duo);
  const rival = relationRank(state.relations.rival);
  const manager = relationRank(state.relations.manager);
  return {
    coach,
    duo,
    rival,
    manager,
    /** VOD rinde más */
    vodBoost: coach >= 1 ? 1 : 0,
    /** Ventaja de draft en la serie */
    draftEdge: coach >= 2 ? 0.14 : 0,
    /** Recuperación extra al cerrar la semana */
    loadManagement: coach >= 3 ? 2 : 0,
    /** Scrims suman más teamplay */
    scrimBoost: duo >= 1 ? 1 : 0,
    /** Ventaja en peleas */
    fightEdge: duo >= 2 ? 0.12 : 0,
    /** Amortigua la caída de forma al perder */
    lossCushion: duo >= 3 ? 3 : 0,
    /** Forma extra al ganar */
    winSurge: rival >= 3 ? 2 : 0,
    /** Reputación extra al ganar */
    repEdge: rival >= 2 ? 1 : 0,
    /** Multiplicador de plata por contenido */
    moneyMult: manager >= 2 ? 1.5 : manager >= 1 ? 1.25 : 1,
  };
}
