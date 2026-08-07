/**
 * Stingers cortos (skill / claim / partido).
 * Silencioso si falla el load — nunca bloquea UI.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

export type StingerId =
  | 'skill_ok'
  | 'skill_fail'
  | 'claim'
  | 'match_win'
  | 'match_loss';

const MUTE_KEY = 'propath.audio.muted';

const SOURCES: Record<StingerId, number> = {
  skill_ok: require('../../assets/sfx/skill_ok.wav'),
  skill_fail: require('../../assets/sfx/skill_fail.wav'),
  claim: require('../../assets/sfx/claim.wav'),
  match_win: require('../../assets/sfx/match_win.wav'),
  match_loss: require('../../assets/sfx/match_loss.wav'),
};

const players: Partial<Record<StingerId, AudioPlayer>> = {};
let ready = false;
let booting: Promise<void> | null = null;
let muted = false;
const muteListeners = new Set<(m: boolean) => void>();

export function isMuted(): boolean {
  return muted;
}

export function subscribeMute(fn: (m: boolean) => void): () => void {
  muteListeners.add(fn);
  return () => muteListeners.delete(fn);
}

export async function setMuted(next: boolean): Promise<void> {
  muted = next;
  muteListeners.forEach((fn) => fn(muted));
  try {
    await AsyncStorage.setItem(MUTE_KEY, next ? '1' : '0');
  } catch {
    /* noop */
  }
}

export async function initAudio(): Promise<void> {
  if (ready) return;
  if (booting) return booting;
  booting = (async () => {
    try {
      const raw = await AsyncStorage.getItem(MUTE_KEY);
      muted = raw === '1';
      muteListeners.forEach((fn) => fn(muted));
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
      });
      (Object.keys(SOURCES) as StingerId[]).forEach((id) => {
        players[id] = createAudioPlayer(SOURCES[id]);
      });
      ready = true;
    } catch {
      ready = false;
    } finally {
      booting = null;
    }
  })();
  return booting;
}

export function playStinger(id: StingerId): void {
  if (muted) return;
  try {
    const player = players[id];
    if (!player) {
      void initAudio().then(() => playStinger(id));
      return;
    }
    void player.seekTo(0).then(() => player.play());
  } catch {
    /* noop */
  }
}
