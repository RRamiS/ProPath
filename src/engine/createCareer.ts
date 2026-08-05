import type { CareerState, ContentPack, PlayerProfile, Stats } from './types';
import { getDuration } from './types';
import { DEFAULT_RELATIONS } from '../content/esports/roster';

function clampStat(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function mergeStats(base: Stats, ...partials: Array<Partial<Stats> | undefined>): Stats {
  const out: Stats = { ...base };
  for (const p of partials) {
    if (!p) continue;
    for (const [k, v] of Object.entries(p)) {
      if (typeof v === 'number') {
        out[k] = clampStat((out[k] ?? 0) + v);
      }
    }
  }
  return out;
}

export function nextRng(seed: number): { value: number; seed: number } {
  const seed2 = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  return { value: seed2 / 0xffffffff, seed: seed2 };
}

export function createCareer(
  pack: ContentPack,
  profile: PlayerProfile,
  seed = Date.now() >>> 0
): CareerState {
  const nation = pack.nations.find((n) => n.id === profile.nationId);
  const role = pack.roles.find((r) => r.id === profile.roleId);
  if (!nation) throw new Error(`Nation not found: ${profile.nationId}`);
  if (!role) throw new Error(`Role not found: ${profile.roleId}`);

  const stages = [...pack.stages].sort((a, b) => a.order - b.order);
  const firstStage = stages[0];
  if (!firstStage) throw new Error('Content pack has no stages');

  const duration = getDuration(profile.durationId);
  const stats = mergeStats(pack.baseStats, nation.startingStats, role.startingStats);

  return {
    packId: pack.id,
    profile: {
      ...profile,
      name: profile.name.trim() || 'Prodigy',
      durationId: duration.id,
    },
    stats,
    flags: {
      ...nation.startingFlags,
      role: role.id,
      nation: nation.id,
      duration: duration.id,
      region: nation.regionId,
    },
    stageId: firstStage.id,
    turn: 0,
    maxTurns: duration.maxTurns,
    durationId: duration.id,
    history: [],
    currentEventId: null,
    endingId: null,
    rngSeed: seed,
    lastNotice: null,
    form: 52,
    fatigue: 18,
    relations: { ...DEFAULT_RELATIONS },
    lastActivity: null,
    lastMatch: null,
    phase: 'hub',
    ticker: [
      `${profile.name.trim() || 'Prodigy'} entra al ranked`,
      `Scouts activos en ${nation.regionId}`,
      'Patch notes: meta estable por ahora',
    ],
    wins: 0,
    losses: 0,
    claimedObjectives: [],
  };
}

/**
 * Rendimientos decrecientes: subir de 30 a 40 es una semana, de 85 a 95 es un
 * mes. Sin esto toda carrera larga termina con todo en 100.
 */
function growthFactor(current: number): number {
  const t = Math.max(0, Math.min(1, current / 100));
  return Math.max(0.18, 1 - Math.pow(t, 1.9) * 0.86);
}

export function applyStatDelta(stats: Stats, delta?: Partial<Stats>): Stats {
  if (!delta) return stats;
  const out = { ...stats };
  for (const [k, v] of Object.entries(delta)) {
    if (typeof v !== 'number') continue;
    const current = out[k] ?? 0;
    // Las pérdidas pegan completas; las ganancias se frenan cerca del techo.
    const applied = v > 0 && k !== 'money' ? v * growthFactor(current) : v;
    out[k] = clampStat(current + applied);
  }
  return out;
}
