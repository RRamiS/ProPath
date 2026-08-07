/**
 * Variantes al tocar un objeto: 3 formas de hacer la misma actividad,
 * cada una con pros/contras. No consume un sistema nuevo — ajusta el bloque.
 */
import type { ChoiceEffect, VenueId, WeekActivityId } from './types';

export interface ActivityChoice {
  id: string;
  label: string;
  hint: string;
  /** Ajustes sobre el impacto base del bloque. */
  effect: ChoiceEffect & { form?: number; fatigue?: number };
  notice: string;
}

const REST_HOME: ActivityChoice[] = [
  {
    id: 'sleep_clean',
    label: 'Dormir de verdad',
    hint: 'Más −fatiga · forma estable',
    effect: { fatigue: -4, stats: { mentality: 2 } },
    notice: 'Apagás todo. El body clock agradece.',
  },
  {
    id: 'stretch',
    label: 'Mobility + siesta corta',
    hint: '+forma · −fatiga media',
    effect: { form: 2, fatigue: -2, stats: { mentality: 1 } },
    notice: 'Estirás, dormís poco, despertás más afilado.',
  },
  {
    id: 'doomscroll',
    label: 'Cama + timeline',
    hint: 'Easter egg · −mente, −fatiga chica',
    effect: { fatigue: -1, stats: { mentality: -2, reputation: 1 } },
    notice: 'Viste tres dramas del circuit. Descansaste… más o menos.',
  },
];

const REST_GYM: ActivityChoice[] = [
  {
    id: 'sauna_reset',
    label: 'Sauna + reset',
    hint: 'Mucho −fatiga · +mente',
    effect: { fatigue: -5, stats: { mentality: 3 } },
    notice: 'Salís del gym más liviano que al entrar.',
  },
  {
    id: 'light_lift',
    label: 'Pesas livianas + descanso',
    hint: '+forma · −fatiga',
    effect: { form: 3, fatigue: -3, stats: { mechanics: 1 } },
    notice: 'Cuerpo laburado, cabeza quieta. Forma arriba.',
  },
  {
    id: 'mirror_talk',
    label: 'Hablarle al espejo',
    hint: 'Easter egg · +mente o tilt',
    effect: { form: 1, fatigue: -2, stats: { mentality: 2, reputation: -1 } },
    notice: 'Nadie grabó… creés. Salís con otra cara.',
  },
];

const CONDITIONING: ActivityChoice[] = [
  {
    id: 'legs',
    label: 'Piernas / core',
    hint: '+forma fuerte · +fatiga',
    effect: { form: 3, fatigue: 2, stats: { mentality: 1 } },
    notice: 'Piernas hechas. Mañana se siente en el chair.',
  },
  {
    id: 'hands',
    label: 'Muñecas + hombros',
    hint: '+mecánicas · fatiga media',
    effect: { form: 1, fatigue: 1, stats: { mechanics: 3 } },
    notice: 'Las manos responden más rápido en la primera ranked.',
  },
  {
    id: 'pr_fail',
    label: 'Intentar el PR',
    hint: 'Easter egg · alto riesgo',
    effect: { form: 2, fatigue: 4, stats: { mentality: -1, mechanics: 2 } },
    notice: 'No fue PR. Fue carácter. Y un poco de dolor.',
  },
];

const PHYSIO: ActivityChoice[] = [
  {
    id: 'foam',
    label: 'Foam roller',
    hint: '−fatiga · +mente',
    effect: { fatigue: -3, stats: { mentality: 2 } },
    notice: 'Nudos afuera. Cabeza un poco más quieta.',
  },
  {
    id: 'eyes',
    label: 'Descanso de ojos',
    hint: '−fatiga · +visión',
    effect: { fatigue: -2, form: 1, stats: { gameSense: 2 } },
    notice: '20-20-20. El minimapa se lee más limpio.',
  },
  {
    id: 'nap_pod',
    label: 'Siesta de 12 minutos',
    hint: 'Mucho −fatiga · −mecánicas chica',
    effect: { fatigue: -5, stats: { mechanics: -1, mentality: 2 } },
    notice: 'El timer suena. Volvés más humano.',
  },
];

const HANGOUT: ActivityChoice[] = [
  {
    id: 'circle',
    label: 'Mesa con el círculo',
    hint: '+dúo/+manager · −fatiga chica',
    effect: { fatigue: -2, relations: { duo: 3, manager: 2 }, stats: { mentality: 2 } },
    notice: 'Café, chisme sano, cero ranked. El círculo sostiene.',
  },
  {
    id: 'meta_talk',
    label: 'Hablar del meta',
    hint: '+visión, +dúo · sin plata',
    effect: { stats: { gameSense: 3 }, relations: { duo: 2, rival: 1 } },
    notice: 'Salen tres picks. Uno es bueno de verdad.',
  },
  {
    id: 'barista_secret',
    label: 'El secreto del barista',
    hint: 'Easter egg · −plata, flag café',
    effect: {
      stats: { money: -1, mentality: 2, reputation: 1 },
      flags: { cafeVip: 1 },
    },
    notice: 'Te cuentan el asiento de la ventana. Quedás en la lista VIP del café.',
  },
];

export function activityChoicesFor(
  activityId: WeekActivityId,
  venueId: VenueId
): ActivityChoice[] | null {
  if (activityId === 'rest') return venueId === 'gym' ? REST_GYM : REST_HOME;
  if (activityId === 'conditioning') return CONDITIONING;
  if (activityId === 'physio') return PHYSIO;
  if (activityId === 'hangout') return HANGOUT;
  return null;
}
