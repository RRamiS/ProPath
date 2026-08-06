/**
 * Requires estáticos de los renders de habitación (Metro no acepta rutas dinámicas).
 * Los PNG los genera `npm run render:rooms`.
 */
import type { ImageSource } from 'expo-image';
import type { VenueId } from '../engine/types';
import type { PropId } from './layout';

export const ROOM_BG: Record<VenueId, ImageSource> = {
  home: require('../../assets/iso/rooms/home.png'),
  gym: require('../../assets/iso/rooms/gym.png'),
  cafe: require('../../assets/iso/rooms/cafe.png'),
  academy: require('../../assets/iso/rooms/academy.png'),
  arena: require('../../assets/iso/rooms/arena.png'),
};

export const ROOM_PROP_ART: Record<VenueId, Record<PropId, ImageSource>> = {
  home: {
    rig: require('../../assets/iso/rooms/home/rig.png'),
    board: require('../../assets/iso/rooms/home/board.png'),
    tv: require('../../assets/iso/rooms/home/tv.png'),
    bed: require('../../assets/iso/rooms/home/bed.png'),
    cam: require('../../assets/iso/rooms/home/cam.png'),
    door: require('../../assets/iso/rooms/home/door.png'),
    window: require('../../assets/iso/rooms/home/window.png'),
    shelf: require('../../assets/iso/rooms/home/shelf.png'),
    banner: require('../../assets/iso/rooms/home/banner.png'),
    poster: require('../../assets/iso/rooms/home/poster.png'),
    rug: require('../../assets/iso/rooms/home/rug.png'),
  },
  gym: {
    rig: require('../../assets/iso/rooms/gym/rig.png'),
    board: require('../../assets/iso/rooms/gym/board.png'),
    tv: require('../../assets/iso/rooms/gym/tv.png'),
    bed: require('../../assets/iso/rooms/gym/bed.png'),
    cam: require('../../assets/iso/rooms/gym/cam.png'),
    door: require('../../assets/iso/rooms/gym/door.png'),
    window: require('../../assets/iso/rooms/gym/window.png'),
    shelf: require('../../assets/iso/rooms/gym/shelf.png'),
    banner: require('../../assets/iso/rooms/gym/banner.png'),
    poster: require('../../assets/iso/rooms/gym/poster.png'),
    rug: require('../../assets/iso/rooms/gym/rug.png'),
  },
  cafe: {
    rig: require('../../assets/iso/rooms/cafe/rig.png'),
    board: require('../../assets/iso/rooms/cafe/board.png'),
    tv: require('../../assets/iso/rooms/cafe/tv.png'),
    bed: require('../../assets/iso/rooms/cafe/bed.png'),
    cam: require('../../assets/iso/rooms/cafe/cam.png'),
    door: require('../../assets/iso/rooms/cafe/door.png'),
    window: require('../../assets/iso/rooms/cafe/window.png'),
    shelf: require('../../assets/iso/rooms/cafe/shelf.png'),
    banner: require('../../assets/iso/rooms/cafe/banner.png'),
    poster: require('../../assets/iso/rooms/cafe/poster.png'),
    rug: require('../../assets/iso/rooms/cafe/rug.png'),
  },
  academy: {
    rig: require('../../assets/iso/rooms/academy/rig.png'),
    board: require('../../assets/iso/rooms/academy/board.png'),
    tv: require('../../assets/iso/rooms/academy/tv.png'),
    bed: require('../../assets/iso/rooms/academy/bed.png'),
    cam: require('../../assets/iso/rooms/academy/cam.png'),
    door: require('../../assets/iso/rooms/academy/door.png'),
    window: require('../../assets/iso/rooms/academy/window.png'),
    shelf: require('../../assets/iso/rooms/academy/shelf.png'),
    banner: require('../../assets/iso/rooms/academy/banner.png'),
    poster: require('../../assets/iso/rooms/academy/poster.png'),
    rug: require('../../assets/iso/rooms/academy/rug.png'),
  },
  arena: {
    rig: require('../../assets/iso/rooms/arena/rig.png'),
    board: require('../../assets/iso/rooms/arena/board.png'),
    tv: require('../../assets/iso/rooms/arena/tv.png'),
    bed: require('../../assets/iso/rooms/arena/bed.png'),
    cam: require('../../assets/iso/rooms/arena/cam.png'),
    door: require('../../assets/iso/rooms/arena/door.png'),
    window: require('../../assets/iso/rooms/arena/window.png'),
    shelf: require('../../assets/iso/rooms/arena/shelf.png'),
    banner: require('../../assets/iso/rooms/arena/banner.png'),
    poster: require('../../assets/iso/rooms/arena/poster.png'),
    rug: require('../../assets/iso/rooms/arena/rug.png'),
  },
};

export function roomBg(venueId: VenueId): ImageSource {
  return ROOM_BG[venueId] ?? ROOM_BG.home;
}

export function roomPropArt(venueId: VenueId, id: PropId): ImageSource | undefined {
  return (ROOM_PROP_ART[venueId] ?? ROOM_PROP_ART.home)[id];
}
