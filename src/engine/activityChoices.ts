/**
 * Variantes al tocar un objeto: 3 formas de hacer la misma actividad,
 * cada una con pros/contras. Algunas piden un verbo interactivo.
 */
import type { InteractVerb } from './interact';
import type { ChoiceEffect, VenueId, WeekActivityId } from './types';

export interface ActivityChoice {
  id: string;
  label: string;
  hint: string;
  effect: ChoiceEffect & { form?: number; fatigue?: number };
  notice: string;
  verb?: InteractVerb;
  failNotice?: string;
  /** Multiplicador de los bonuses positivos si fallás el check (default 0.35). */
  failScale?: number;
  sortItems?: string[];
}

const REST_HOME: ActivityChoice[] = [
  {
    id: 'sleep_clean',
    label: 'Dormir de verdad',
    hint: 'Más −fatiga · reacción',
    verb: 'react',
    effect: { fatigue: -4, stats: { mentality: 2 } },
    notice: 'Apagás todo. El body clock agradece.',
    failNotice: 'El celular gana. Dormís a medias.',
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
    hint: 'Easter egg · −mente',
    effect: { fatigue: -1, stats: { mentality: -2, reputation: 1 } },
    notice: 'Viste tres dramas del circuit. Descansaste… más o menos.',
  },
];

const REST_GYM: ActivityChoice[] = [
  {
    id: 'sauna_reset',
    label: 'Sauna + reset',
    hint: 'Mucho −fatiga · reacción',
    verb: 'react',
    effect: { fatigue: -5, stats: { mentality: 3 } },
    notice: 'Salís del gym más liviano que al entrar.',
    failNotice: 'Salís antes. El reset queda a medias.',
  },
  {
    id: 'light_lift',
    label: 'Pesas livianas + descanso',
    hint: '+forma · timing del set',
    verb: 'timing',
    effect: { form: 3, fatigue: -3, stats: { mechanics: 1 } },
    notice: 'Cuerpo laburado, cabeza quieta. Forma arriba.',
    failNotice: 'Forma floja en el último set. Igual suma un poco.',
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
    hint: '+forma fuerte · reacción',
    verb: 'react',
    effect: { form: 3, fatigue: 2, stats: { mentality: 1 } },
    notice: 'Piernas hechas. Mañana se siente en el chair.',
    failNotice: 'Cortás el bloque. Piernas a medias, ego también.',
  },
  {
    id: 'hands',
    label: 'Muñecas + hombros',
    hint: '+mecánicas · timing',
    verb: 'timing',
    effect: { form: 1, fatigue: 1, stats: { mechanics: 3 } },
    notice: 'Las manos responden más rápido en la primera ranked.',
    failNotice: 'Te pasás de rosca. Manos torpes el resto del día.',
    failScale: 0.2,
  },
  {
    id: 'pr_fail',
    label: 'Intentar el PR',
    hint: 'Easter egg · ventana de fuerza',
    verb: 'tap',
    effect: { form: 2, fatigue: 4, stats: { mentality: -1, mechanics: 2 } },
    notice: 'Casi PR. Fue carácter. Y un poco de dolor.',
    failNotice: 'El PR te gana. Dolor sin gloria.',
  },
];

const PHYSIO: ActivityChoice[] = [
  {
    id: 'foam',
    label: 'Foam roller',
    hint: '−fatiga · reacción',
    verb: 'react',
    effect: { fatigue: -3, stats: { mentality: 2 } },
    notice: 'Nudos afuera. Cabeza un poco más quieta.',
    failNotice: 'Dejás el foam a los dos minutos. Poco cambio.',
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
    hint: 'Mucho −fatiga · reacción',
    verb: 'react',
    effect: { fatigue: -5, stats: { mechanics: -1, mentality: 2 } },
    notice: 'El timer suena. Volvés más humano.',
    failNotice: 'El alarm no suena… dormís de más. Mecánicas flojas.',
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
    label: 'Hablar de lo que está fuerte',
    hint: '+lectura · ordená ideas',
    verb: 'sort',
    sortItems: ['Poke', 'Engage', 'Scaling', 'Flex'],
    effect: { stats: { gameSense: 3 }, relations: { duo: 2, rival: 1 } },
    notice: 'Salen tres picks. Uno es bueno de verdad.',
  },
  {
    id: 'barista_secret',
    label: 'El secreto del barista',
    hint: 'Easter egg · ventana de charla',
    verb: 'tap',
    effect: {
      stats: { money: -1, mentality: 2, reputation: 1 },
      flags: { cafeVip: 1 },
    },
    notice: 'Te cuentan el asiento de la ventana. Quedás en la lista VIP del café.',
    failNotice: 'El barista está ocupado. Solo conseguís un latte.',
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

/** Escala el efecto de una variante si falló el skill check. */
export function scaleActivityChoice(
  choice: ActivityChoice,
  success: boolean
): ActivityChoice {
  if (success) return choice;
  const scale = choice.failScale ?? 0.35;
  const stats: NonNullable<ChoiceEffect['stats']> = {};
  for (const [k, v] of Object.entries(choice.effect.stats ?? {})) {
    if (typeof v !== 'number') continue;
    stats[k] = v > 0 ? Math.max(0, Math.round(v * scale)) : v;
  }
  const relations: NonNullable<ChoiceEffect['relations']> = {};
  for (const [k, v] of Object.entries(choice.effect.relations ?? {})) {
    if (typeof v !== 'number') continue;
    relations[k as keyof typeof relations] = v > 0 ? Math.max(0, Math.round(v * scale)) : v;
  }
  return {
    ...choice,
    effect: {
      ...choice.effect,
      stats,
      relations,
      form: choice.effect.form
        ? choice.effect.form > 0
          ? Math.max(0, Math.round(choice.effect.form * scale))
          : choice.effect.form
        : undefined,
      fatigue: choice.effect.fatigue,
    },
    notice: choice.failNotice ?? `${choice.notice} (a medias)`,
  };
}
