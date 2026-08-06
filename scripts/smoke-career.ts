/**
 * Simula partidas (sin UI) para validar loop continuo + variedad de situaciones.
 * Ejecutar: npx --yes tsx scripts/smoke-career.ts
 */
import {
  applyChoice,
  applyWeekActivity,
  availableActivities,
  closeSeason,
  continueSeason,
  createCareer,
  maybeForceRetire,
  nextRng,
  openEvent,
  pickSituation,
  retire,
  travelTo,
  RUN_DURATIONS,
  type RunDurationId,
  type WeekActivityId,
} from '../src/engine';
import { resolveMatch } from '../src/match/simulate';
import { esportsPack } from '../src/content/esports/pack';

const ACTIVITY_CYCLE: WeekActivityId[] = ['soloq', 'vod', 'scrim', 'match', 'rest', 'content'];

const MATCH_LINES = [
  ['safe', 'farm', 'peel', 'siege'],
  ['prio', 'playmake', 'focus', 'close'],
  ['flex', 'roam', 'bail', 'stall'],
  ['safe', 'farm', 'steal', 'baron'],
  ['prio', 'farm', 'focus', 'close'],
];

type Brain = 'cycle' | 'mental' | 'smart';

function smartPick(state: ReturnType<typeof createCareer>, options: WeekActivityId[]) {
  if (state.fatigue >= 58 && options.includes('rest')) return 'rest';
  if (state.fatigue < 70 && options.includes('match')) return 'match';
  if (state.form < 48 && options.includes('soloq')) return 'soloq';
  if (options.includes('scrim') && state.fatigue < 55) return 'scrim';
  if (options.includes('vod')) return 'vod';
  if (options.includes('rest')) return 'rest';
  return options[0]!;
}

function ensureVenue(state: ReturnType<typeof createCareer>, activity: WeekActivityId) {
  if (activity === 'match' && state.venueId !== 'arena') return travelTo(state, 'arena');
  if (activity === 'scrim' && state.venueId !== 'academy') return travelTo(state, 'academy');
  if (activity === 'rest' && state.venueId !== 'home' && state.venueId !== 'gym') {
    return travelTo(state, 'home');
  }
  if ((activity === 'soloq' || activity === 'content') && state.venueId !== 'home') {
    return travelTo(state, 'home');
  }
  if (activity === 'vod' && state.venueId !== 'home' && state.venueId !== 'academy') {
    return travelTo(state, 'home');
  }
  return state;
}

function playThrough(durationId: RunDurationId, seed: number, brain: Brain = 'cycle') {
  let state = createCareer(
    esportsPack,
    { name: 'SmokeBot', nationId: 'ar', roleId: 'mid', durationId },
    seed
  );

  let guard = 0;
  let actIdx = 0;
  let rng = seed;
  let seasonsDone = 0;
  const targetSeasons = 2;
  const seenKeys: string[] = [];

  while (!state.endingId && guard < 800) {
    guard++;

    if (state.phase === 'seasonBreak') {
      seasonsDone++;
      if (seasonsDone >= targetSeasons || state.ageYears >= 38) {
        state = retire(state, false);
        break;
      }
      state = continueSeason(state);
      continue;
    }

    if (state.phase === 'hub' || !state.currentEventId) {
      let options = availableActivities(state, esportsPack);
      if (options.length === 0) {
        state = travelTo(state, 'home');
        options = availableActivities(state, esportsPack);
        if (options.length === 0) throw new Error('No activities at home');
      }

      const ids = options.map((o) => o.id);
      let activity: WeekActivityId;
      if (brain === 'smart') activity = smartPick(state, ids);
      else {
        activity = ACTIVITY_CYCLE[actIdx % ACTIVITY_CYCLE.length]!;
        if (!ids.includes(activity)) activity = ids[actIdx % ids.length]!;
      }
      actIdx++;

      state = ensureVenue(state, activity);
      options = availableActivities(state, esportsPack);
      if (!options.some((o) => o.id === activity)) {
        activity = options[0]!.id;
      }

      const outcome = applyWeekActivity(esportsPack, state, activity);
      state = outcome.state;

      if (outcome.kind === 'ending') break;
      if (outcome.kind === 'season') continue;
      if (outcome.kind === 'slot') continue;

      if (outcome.kind === 'match') {
        const pick = nextRng(rng);
        rng = pick.seed;
        const line = MATCH_LINES[Math.floor(pick.value * MATCH_LINES.length)]!;
        const { state: after } = resolveMatch(state, line, 'Smoke Opp');
        if (after.weekInSeason >= after.maxTurns) {
          const roll = nextRng(after.rngSeed);
          const closed = closeSeason({ ...after, rngSeed: roll.seed });
          const forced = maybeForceRetire(closed, roll.value);
          state = forced ?? closed;
        } else {
          state = openEvent(esportsPack, { ...after, phase: 'event' });
        }
      } else {
        state = openEvent(esportsPack, state);
      }
      continue;
    }

    const sit = state.currentSituation;
    const choices = sit?.choices ?? [];
    if (choices.length === 0) {
      // Legacy fallback via pack — director always sets situation, but be safe
      throw new Error(`No choices for ${state.currentEventId}`);
    }

    const key = `${sit!.archetypeId}|${sit!.actors.join(',')}|${sit!.cause}|${sit!.venueId}`;
    seenKeys.push(key);

    let choice = choices[0]!;
    if (brain !== 'cycle' || (state.stats.mentality ?? 0) < 40) {
      choice = [...choices].sort((a, b) => {
        const am = a.effect.stats?.mentality ?? 0;
        const bm = b.effect.stats?.mentality ?? 0;
        return bm - am;
      })[0]!;
    } else {
      const pick = nextRng(rng + sit!.archetypeId.length);
      rng = pick.seed;
      choice = choices[Math.floor(pick.value * choices.length)]!;
    }

    state = applyChoice(esportsPack, state, choice.id);
  }

  if (!state.endingId) state = retire(state, false);

  const ending = esportsPack.endings.find((e) => e.id === state.endingId);

  // Exact repeat window: same archetype+actors+cause+venue within 8
  let exactRepeat = 0;
  for (let i = 0; i < seenKeys.length; i++) {
    for (let j = Math.max(0, i - 8); j < i; j++) {
      if (seenKeys[i] === seenKeys[j]) exactRepeat++;
    }
  }

  return {
    durationId,
    turns: state.turn,
    seasons: state.season,
    age: state.ageYears,
    cash: state.cash,
    owned: state.ownedItems.length,
    stage: state.stageId,
    ending: ending?.title ?? state.endingId,
    tier: ending?.tier,
    mentality: state.stats.mentality,
    form: state.form,
    fatigue: state.fatigue,
    record: `${state.wins}-${state.losses}`,
    memories: state.memories.length,
    threads: state.activeThreads.length,
    rosterDuo: state.roster.duo.name,
    situations: seenKeys.length,
    exactRepeatIn8: exactRepeat,
    uniqueSituations: new Set(seenKeys).size,
  };
}

function assertDeterminism() {
  const a = createCareer(esportsPack, { name: 'A', nationId: 'ar', roleId: 'mid', durationId: 'sprint' }, 99);
  const b = createCareer(esportsPack, { name: 'A', nationId: 'ar', roleId: 'mid', durationId: 'sprint' }, 99);
  const sa = pickSituation(esportsPack, a);
  const sb = pickSituation(esportsPack, b);
  if (sa.instance.instanceId.split('_').slice(0, 2).join('_') !== sb.instance.instanceId.split('_').slice(0, 2).join('_')) {
    // archetype + turn should match; full instance id includes rng roll — compare archetype/cause determinism
  }
  if (sa.instance.archetypeId !== sb.instance.archetypeId || sa.instance.cause !== sb.instance.cause) {
    throw new Error('Determinism failed: same seed produced different situation archetype/cause');
  }
  if (a.roster.duo.name !== b.roster.duo.name) {
    throw new Error('Determinism failed: roster mismatch');
  }
  console.log('determinism — OK', sa.instance.archetypeId, sa.instance.cause);
}

const results: ReturnType<typeof playThrough>[] = [];
for (const d of RUN_DURATIONS) {
  const a = playThrough(d.id, 42 + d.maxTurns, 'cycle');
  const b = playThrough(d.id, 42 + d.maxTurns, 'mental');
  const c = playThrough(d.id, 42 + d.maxTurns, 'smart');
  results.push(a, b, c);
  console.log('ciego ', JSON.stringify(a));
  console.log('mental', JSON.stringify(b));
  console.log('smart ', JSON.stringify(c));
}

assertDeterminism();

const losses = results.some((r) => r.record.includes('-') && !r.record.endsWith('-0'));
const tiers = new Set(results.map((r) => r.tier));
const repeats = results.reduce((s, r) => s + r.exactRepeatIn8, 0);
console.log('OK —', esportsPack.events.length, 'events,', esportsPack.endings.length, 'endings');
console.log('variety — tiers:', [...tiers].join(','), '| hasLosses:', losses);
console.log(
  'life sim — seasons:',
  results.map((r) => r.seasons).join('/'),
  '| ages:',
  results.map((r) => r.age).join('/')
);
console.log(
  'world — memories:',
  results.map((r) => r.memories).join('/'),
  '| uniqueSit:',
  results.map((r) => r.uniqueSituations).join('/'),
  '| exactRepeatIn8:',
  repeats
);
if (repeats > results.length * 3) {
  console.warn('WARN — high exact situation repeats within window 8');
}
