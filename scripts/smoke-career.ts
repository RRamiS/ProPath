/**
 * Simula partidas completas (sin UI) para validar el loop hub → actividad → evento/match.
 * Ejecutar: npx --yes tsx scripts/smoke-career.ts
 */
import {
  applyChoice,
  applyWeekActivity,
  createCareer,
  nextRng,
  openEvent,
  RUN_DURATIONS,
  type RunDurationId,
  type WeekActivityId,
} from '../src/engine';
import { resolveMatch } from '../src/match/simulate';
import { esportsPack } from '../src/content/esports/pack';

const ACTIVITY_CYCLE: WeekActivityId[] = ['soloq', 'vod', 'scrim', 'match', 'rest', 'content'];

const MATCH_LINES = [
  ['safe', 'farm', 'peel'],
  ['prio', 'playmake', 'focus'],
  ['flex', 'roam', 'bail'],
  ['safe', 'farm', 'steal'],
  ['prio', 'farm', 'focus'],
];

function playThrough(durationId: RunDurationId, seed: number, preferMental = false) {
  let state = createCareer(
    esportsPack,
    { name: 'SmokeBot', nationId: 'ar', roleId: 'mid', durationId },
    seed
  );

  let guard = 0;
  let actIdx = 0;
  let rng = seed;

  while (!state.endingId && guard < 400) {
    guard++;

    if (state.phase === 'hub' || !state.currentEventId) {
      const activity = ACTIVITY_CYCLE[actIdx % ACTIVITY_CYCLE.length]!;
      actIdx++;
      const outcome = applyWeekActivity(esportsPack, state, activity);
      state = outcome.state;

      if (outcome.kind === 'ending') break;

      if (outcome.kind === 'match') {
        const pick = nextRng(rng);
        rng = pick.seed;
        const line = MATCH_LINES[Math.floor(pick.value * MATCH_LINES.length)]!;
        const { state: after } = resolveMatch(state, line, 'Smoke Opp');
        state = openEvent(esportsPack, { ...after, phase: 'event' });
      } else {
        state = openEvent(esportsPack, state);
      }
      continue;
    }

    const event = esportsPack.events.find((e) => e.id === state.currentEventId);
    if (!event) throw new Error(`Missing event ${state.currentEventId}`);

    let choice = event.choices[0]!;
    if (preferMental || (state.stats.mentality ?? 0) < 40) {
      choice = [...event.choices].sort((a, b) => {
        const am = a.effect.stats?.mentality ?? 0;
        const bm = b.effect.stats?.mentality ?? 0;
        return bm - am;
      })[0]!;
    } else {
      const pick = nextRng(rng + event.id.length);
      rng = pick.seed;
      choice = event.choices[Math.floor(pick.value * event.choices.length)]!;
    }

    state = applyChoice(esportsPack, state, choice.id);
  }

  if (!state.endingId) throw new Error(`${durationId}: no ending after ${guard} steps`);
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
    form: state.form,
    fatigue: state.fatigue,
    record: `${state.wins}-${state.losses}`,
    relations: state.relations,
  };
}

const results: ReturnType<typeof playThrough>[] = [];
for (const d of RUN_DURATIONS) {
  const a = playThrough(d.id, 42 + d.maxTurns, false);
  const b = playThrough(d.id, 42 + d.maxTurns, true);
  results.push(a, b);
  console.log('default', JSON.stringify(a));
  console.log('mental', JSON.stringify(b));
}

const losses = results.some((r) => r.record.includes('-') && !r.record.endsWith('-0'));
const tiers = new Set(results.map((r) => r.tier));
console.log('OK —', esportsPack.events.length, 'events,', esportsPack.endings.length, 'endings');
console.log('variety — tiers:', [...tiers].join(','), '| hasLosses:', losses);
