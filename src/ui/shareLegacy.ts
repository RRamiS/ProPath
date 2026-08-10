import type { RefObject } from 'react';
import { Share, type View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

export type ShareResult = 'shared' | 'unavailable' | 'failed';

/**
 * Captura una View (ShareCard) y abre el sheet nativo.
 * Si no hay sharing de archivos (web): cae a Share de texto.
 */
export async function shareViewAsImage(
  ref: RefObject<View | null>,
  opts?: { dialogTitle?: string; message?: string }
): Promise<ShareResult> {
  try {
    if (!ref.current) return 'failed';

    const uri = await captureRef(ref, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
    const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/png',
        dialogTitle: opts?.dialogTitle ?? 'Compartir legacy',
        UTI: 'public.png',
      });
      return 'shared';
    }

    if (opts?.message) {
      await Share.share({
        message: opts.message,
        title: opts.dialogTitle ?? 'ProPath',
      });
      return 'shared';
    }

    return 'unavailable';
  } catch {
    return 'failed';
  }
}
