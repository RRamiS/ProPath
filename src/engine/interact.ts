/** Verbos jugables: no solo tap de opción. */
export type InteractVerb = 'choice' | 'timing' | 'react' | 'sort' | 'tap' | 'hold';

export function verbLabel(verb: InteractVerb | undefined): string | undefined {
  if (!verb || verb === 'choice') return undefined;
  if (verb === 'timing') return 'timing';
  if (verb === 'react' || verb === 'hold') return 'reacción';
  if (verb === 'sort') return 'ordenar';
  if (verb === 'tap') return 'ventana';
  return undefined;
}

export function needsChallenge(verb: InteractVerb | undefined): boolean {
  return !!verb && verb !== 'choice';
}

/** Normaliza legacy `hold` → `react`. */
export function resolveVerb(verb: InteractVerb | undefined): InteractVerb | undefined {
  if (verb === 'hold') return 'react';
  return verb;
}
