/**
 * Personajes isométricos (Quaternius CC0). Ver assets/CREDITS.md.
 * Regenerar con: npm run render:rooms
 *
 * Los props y los fondos de habitación viven en `roomArt.ts` porque dependen
 * de la sede.
 */
import type { ImageSource } from 'expo-image';
import type { RelationKey } from '../engine/types';

export const CHARACTER_ART: Record<'player' | RelationKey, ImageSource> = {
  player: require('../../assets/iso/characters/player.png'),
  coach: require('../../assets/iso/characters/coach.png'),
  duo: require('../../assets/iso/characters/duo.png'),
  rival: require('../../assets/iso/characters/rival.png'),
  manager: require('../../assets/iso/characters/manager.png'),
};

export function characterArt(kind: 'player' | RelationKey): ImageSource | undefined {
  return CHARACTER_ART[kind];
}
