/**
 * Unit smoke del director: seed de pickActors, efectos por actor, soft paths.
 * Ejecutar: npx --yes tsx scripts/test-director.ts
 */
import assert from 'node:assert/strict';
import { createCareer, openSituation, applyChoice, pickSituation } from '../src/engine';
import { SITUATION_ARCHETYPES } from '../src/engine/situations';
import { esportsPack } from '../src/content/esports/pack';

function run() {
  const base = createCareer(
    esportsPack,
    { name: 'Unit', nationId: 'ar', roleId: 'mid', durationId: 'season' },
    42
  );

  const a = pickSituation(esportsPack, { ...base, venueId: 'academy', rngSeed: 100 });
  const b = pickSituation(esportsPack, { ...base, venueId: 'academy', rngSeed: 100 });
  assert.equal(a.instance.archetypeId, b.instance.archetypeId, 'same seed → same archetype');
  assert.deepEqual(a.instance.actors, b.instance.actors, 'same seed → same actors');

  const rift = SITUATION_ARCHETYPES.find((x) => x.id === 'roster_rift')!;
  const forced = openSituation(esportsPack, {
    ...base,
    venueId: 'academy',
    rngSeed: 7,
    // bias: keep academy so roster_rift is eligible
  });
  assert.ok(forced.currentSituation, 'opens situation');
  assert.equal(forced.venueId, 'academy', 'no teleport');

  // Find a back_actor choice if present
  let state = forced;
  const sit = state.currentSituation!;
  const back = sit.choices.find((c) => c.id === 'back_actor');
  if (back) {
    const primary = sit.actors[0]!;
    const before = state.relations[primary];
    state = applyChoice(esportsPack, state, 'back_actor');
    assert.ok(
      state.relations[primary] !== before || sit.actors.length === 1,
      'actor-linked relation change applied or single-actor case'
    );
    assert.equal(state.flags.lastChoice, 'back_actor');
  }

  const storyletCount = SITUATION_ARCHETYPES.length;
  assert.ok(storyletCount >= 12, `expected >=12 storylets, got ${storyletCount}`);

  console.log('test-director OK', {
    storylets: storyletCount,
    sample: a.instance.archetypeId,
    actors: a.instance.actors,
  });
}

run();
