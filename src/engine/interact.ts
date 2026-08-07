/** Verbos jugables: no solo tap de opción. */
export type InteractVerb = 'choice' | 'timing' | 'hold' | 'sort' | 'tap';

export function verbLabel(verb: InteractVerb | undefined): string | undefined {
  if (!verb || verb === 'choice') return undefined;
  if (verb === 'timing') return 'timing';
  if (verb === 'hold') return 'hold';
  if (verb === 'sort') return 'ordenar';
  if (verb === 'tap') return 'ventana';
  return undefined;
}

export function needsChallenge(verb: InteractVerb | undefined): boolean {
  return !!verb && verb !== 'choice';
}
