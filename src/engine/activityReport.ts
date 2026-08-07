/**
 * Parte de cierre de bloque: cada actividad se siente distinta.
 */
import { nextRng } from './rng';
import type { CareerState, WeekActivityId } from './types';

const LINES: Record<WeekActivityId, string[]> = {
  soloq: [
    'LP +18. Una remake, cero perdón.',
    'Win streak cortada en la quinta. Manos calientes igual.',
    'Hardstuck una hora… y después un outplay que guarda el VOD.',
    'El chat rival te tiltó. Cerraste ranked a tiempo.',
  ],
  scrim: [
    'Dos bloques. El mid-jungle sync empezó a existir.',
    'El coach cortó tres fights. Dolor útil.',
    'Side lane limpio. El dúo te mira distinto.',
    'Scrim denso: cero highlights, mucho teamplay.',
  ],
  vod: [
    'Frame 14:32 — el error que no querías ver.',
    'Tres pauses. Un patrón. Menos ego.',
    'El coach marca vision gaps. Anotás sin discutir.',
    'Lab corto, lectura larga. El mapa se agranda.',
  ],
  rest: [
    'Sueño pesado. El body clock vuelve a cero.',
    'Siesta + agua. La cabeza deja de zumbar.',
    'Apagaste todo. Mañana hay manos otra vez.',
  ],
  content: [
    'Clip out. Comentarios mixtos, plata real.',
    'Stream corto: el manager sonríe, el coach no.',
    'Un short, mil views. La marca mira de reojo.',
  ],
  match: [
    'Luces. Draft. El público ya grita.',
  ],
  conditioning: [
    'Piernas pesadas, forma arriba. El chair va a doler.',
    'Core hecho. Mañana el APM se siente más estable.',
    'Sudor, playlist, cero ranked. Cuerpo primero.',
  ],
  physio: [
    'Foam + ojos. El minimapa vuelve a nítido.',
    'Nudos afuera. Fatiga en bajada.',
    'Siesta de 12. Humano otra vez.',
  ],
  hangout: [
    'Café largo. El círculo te acomoda la cabeza.',
    'Meta en la servilleta. Un pick queda.',
    'Chisme sano, cero LP. A veces hace falta.',
  ],
};

export function activityReportLine(
  activityId: WeekActivityId,
  state: CareerState,
  baseNotice: string
): string {
  const pool = LINES[activityId] ?? [baseNotice];
  const r = nextRng(state.rngSeed + activityId.length * 13 + state.turn * 7);
  const flavor = pool[Math.floor(r.value * pool.length)] ?? baseNotice;
  const deltas: string[] = [];
  if (activityId === 'soloq') deltas.push(`Forma ${Math.round(state.form)}`);
  if (activityId === 'scrim') deltas.push(`Dúo ${Math.round(state.relations.duo)}`);
  if (activityId === 'vod') deltas.push(`Coach ${Math.round(state.relations.coach)}`);
  if (activityId === 'conditioning' || activityId === 'physio' || activityId === 'rest') {
    deltas.push(`Fatiga ${Math.round(state.fatigue)}`);
  }
  if (activityId === 'hangout') deltas.push('Círculo activo');
  const tail = deltas.length ? ` · ${deltas.join(' · ')}` : '';
  return `${baseNotice}\n${flavor}${tail}`;
}
