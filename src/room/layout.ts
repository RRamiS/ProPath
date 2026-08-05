/**
 * Layout del diorama. Todo en porcentajes sobre la caja de la escena para que
 * escale igual en teléfono y en web sin recalcular nada.
 *
 * Dos planos: la pared (arriba) y el piso (abajo). El horizonte los separa.
 */
export const HORIZON = 0.7;

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
  /** Caja en porcentaje de la escena */
  left: number;
  top: number;
  width: number;
  height: number;
  plane: 'wall' | 'floor';
  /** Orden de etapa desde el que aparece la decoración */
  minStageOrder?: number;
}

/** Props que disparan actividades. La posición no cambia entre etapas: memoria muscular. */
export const ACTION_PROPS: PropSpec[] = [
  { id: 'board', left: 4, top: 9, width: 25, height: 25, plane: 'wall' },
  { id: 'tv', left: 33, top: 11, width: 24, height: 21, plane: 'wall' },
  { id: 'bed', left: 3, top: 52, width: 27, height: 19, plane: 'floor' },
  { id: 'rig', left: 33, top: 40, width: 31, height: 31, plane: 'floor' },
  { id: 'cam', left: 67, top: 44, width: 13, height: 27, plane: 'floor' },
  { id: 'door', left: 82, top: 23, width: 16, height: 48, plane: 'floor' },
];

/** Decoración: no se toca, pero cuenta en qué punto de la carrera estás. */
export const DECOR_PROPS: PropSpec[] = [
  { id: 'window', left: 60, top: 8, width: 18, height: 26, plane: 'wall' },
  { id: 'poster', left: 30, top: 36, width: 9, height: 13, plane: 'wall' },
  { id: 'rug', left: 24, top: 74, width: 44, height: 9, plane: 'floor' },
  { id: 'shelf', left: 4, top: 38, width: 22, height: 11, plane: 'wall', minStageOrder: 3 },
  { id: 'banner', left: 79, top: 2, width: 19, height: 20, plane: 'wall', minStageOrder: 4 },
];

export function propById(id: string): PropSpec | undefined {
  return [...ACTION_PROPS, ...DECOR_PROPS].find((p) => p.id === id);
}

/** Nombre del cuarto según dónde estés en la carrera. */
export const ROOM_NAMES: Record<string, string> = {
  soloq: 'Tu pieza',
  academy: 'Cuarto de academia',
  challengers: 'Depto del roster',
  tier1: 'Gaming house',
  worlds: 'Suite del torneo',
};
