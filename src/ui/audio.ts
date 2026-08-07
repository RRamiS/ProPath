/**
 * Stingers cortos (skill / claim / partido).
 * Silencioso si falla el load — nunca bloquea UI.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

export type StingerId =
  | 'skill_ok'
  | 'skill_fail'
  | 'claim'
  | 'match_win'
  | 'match_loss';

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

export async function initAudio(): Promise<void> {
  if (ready) return;
  if (booting) return booting;
  booting = (async () => {
    try {
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
