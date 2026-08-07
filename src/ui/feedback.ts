import { Platform, Vibration } from 'react-native';
import { playStinger } from './audio';

/** Feedback táctil + stinger al resolver un skill check. */
export function buzzSkill(ok: boolean) {
  playStinger(ok ? 'skill_ok' : 'skill_fail');
  if (Platform.OS === 'web') return;
  try {
    if (ok) Vibration.vibrate(36);
    else Vibration.vibrate([0, 50, 35, 70]);
  } catch {
    /* noop */
  }
}

export function buzzSelect() {
  if (Platform.OS === 'web') return;
  try {
    Vibration.vibrate(12);
  } catch {
    /* noop */
  }
}

export function buzzClaim() {
  playStinger('claim');
  if (Platform.OS === 'web') return;
  try {
    Vibration.vibrate([0, 28, 40, 40]);
  } catch {
    /* noop */
  }
}

export function buzzMatch(won: boolean) {
  playStinger(won ? 'match_win' : 'match_loss');
  if (Platform.OS === 'web') return;
  try {
    if (won) Vibration.vibrate([0, 40, 50, 60]);
    else Vibration.vibrate([0, 70, 40, 90]);
  } catch {
    /* noop */
  }
}
