/**
 * Simula partidas completas (sin UI) para validar el loop.
 * Ejecutar: npx --yes tsx scripts/smoke-career.ts
 */
import {
  advanceToEvent,
  applyChoice,
  createCareer,
  RUN_DURATIONS,
  type RunDurationId,
} from '../src/engine';
import { esportsPack } from '../src/content/esports/pack';

function playThrough(durationId: RunDurationId, seed: number, preferMental = false) {
  let state = createCareer(
    esportsPack,
    { name: 'SmokeBot', nationId: 'ar', roleId: 'mid', durationId },
    seed
  );
  state = advanceToEvent(esportsPack, state);

  let guard = 0;
  while (!state.endingId && guard < 200) {
    guard++;
    const event = esportsPack.events.find((e) => e.id === state.currentEventId);
    if (!event) throw new Error(`Missing event ${state.currentEventId}`);

    let choice = event.choices[0]!;
    if (preferMental || (state.stats.mentality ?? 0) < 40) {
      choice = [...event.choices].sort((a, b) => {
        const am = a.effect.stats?.mentality ?? 0;
        const bm = b.effect.stats?.mentality ?? 0;
        return bm - am;
      })[0]!;
    }

    state = applyChoice(esportsPack, state, choice.id);
  }

  if (!state.endingId) throw new Error(`${durationId}: no ending`);
  if (state.turn > state.maxTurns) throw new Error(`${durationId}: exceeded maxTurns`);

  const ending = esportsPack.endings.find((e) => e.id === state.endingId);
  return {
    durationId,
    turns: state.turn,
    maxTurns: state.maxTurns,
    stage: state.stageId,
    ending: ending?.title ?? state.endingId,
    tier: ending?.tier,
    mentality: state.stats.mentality,
  };
}

for (const d of RUN_DURATIONS) {
  console.log('default', JSON.stringify(playThrough(d.id, 42 + d.maxTurns, false)));
  console.log('mental', JSON.stringify(playThrough(d.id, 42 + d.maxTurns, true)));
}

console.log('OK —', esportsPack.events.length, 'events,', esportsPack.endings.length, 'endings');
