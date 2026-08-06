import { create } from 'zustand';
import {
  applyChoice,
  applyWeekActivity,
  buyItem,
  closeSeason,
  continueSeason,
  createCareer,
  maybeForceRetire,
  maybePromote,
  nextRng,
  openEvent,
  openNpcActionSituation,
  retire,
  travelTo,
  type CareerState,
  type ContentPack,
  type EventMinigame,
  type PlayerProfile,
  type RelationKey,
  type VenueId,
  type WeekActivityId,
  switchRole as applyRoleSwitch,
} from '../engine';
import { esportsPack } from '../content/esports/pack';
import { applyMinigameResult, type MinigameGrade } from '../minigames/applyResult';
import { resolveMatch } from '../match/simulate';
import { markNpcMet } from '../engine/npcDirector';
import { currentPlayableEvent } from '../engine/applyChoice';

type Screen =
  | 'home'
  | 'create'
  | 'weekHub'
  | 'play'
  | 'match'
  | 'minigame'
  | 'ending'
  | 'seasonBreak'
  | 'shop'
  | 'city';

type MatchPhase = 'live' | 'result';

export type CinematicPayload = {
  title: string;
  subtitle?: string;
  beats?: string[];
  vibe: 'kickoff' | 'promote' | 'skill' | 'ending' | 'match' | 'season';
  durationMs?: number;
};

interface GameStore {
  pack: ContentPack;
  screen: Screen;
  career: CareerState | null;
  draft: Partial<PlayerProfile>;
  activeMinigame: EventMinigame | null;
  cinematic: CinematicPayload | null;
  matchPhase: MatchPhase;
  npcTalk: string | null;
  setScreen: (s: Screen) => void;
  setDraft: (p: Partial<PlayerProfile>) => void;
  startCareer: () => void;
  switchRole: (roleId: string) => void;
  pickActivity: (activityId: WeekActivityId) => void;
  resolveLiveMatch: (choices: string[], opponent: string) => void;
  continueAfterMatch: () => void;
  choose: (choiceId: string) => void;
  enterMinigame: () => void;
  completeMinigame: (grade: MinigameGrade) => void;
  dismissCinematic: () => void;
  buyShopItem: (itemId: string) => void;
  travel: (venueId: VenueId) => void;
  continueNextSeason: () => void;
  retireCareer: () => void;
  talkToNpc: (kind: RelationKey, line: string) => void;
  clearNpcTalk: () => void;
  softFail: (notice: string) => void;
  reset: () => void;
}

const defaultDraft: Partial<PlayerProfile> = {
  name: '',
  nationId: 'ar',
  roleId: 'mid',
};

function stageLabel(pack: ContentPack, stageId: string) {
  return pack.stages.find((s) => s.id === stageId)?.name ?? stageId;
}

function maybePromotionCinematic(
  pack: ContentPack,
  prev: CareerState,
  next: CareerState
): CinematicPayload | null {
  if (prev.stageId === next.stageId) return null;
  const label = stageLabel(pack, next.stageId);
  return {
    vibe: 'promote',
    title: label,
    beats: [
      next.lastNotice ?? 'El circuito te abre la puerta.',
      `Nuevo escenario: ${label}. Los rivales ya no fallan las que fallabas vos.`,
      `T${next.season} · Semana ${next.weekInSeason} · ${next.wins}V–${next.losses}D.`,
    ],
  };
}

function endingCinematic(pack: ContentPack, next: CareerState): CinematicPayload {
  const ending = pack.endings.find((e) => e.id === next.endingId);
  return {
    vibe: 'ending',
    title: ending?.title ?? 'Retiro',
    beats: [
      ending?.body ?? 'Se cierra el ciclo.',
      `${next.ageYears} años · ${next.season} temporadas · ${next.wins}V–${next.losses}D.`,
      `Dejaste $${next.cash} en el banco y un setup de ${next.ownedItems.length} piezas.`,
    ],
    durationMs: 999999,
  };
}

function seasonCinematic(next: CareerState): CinematicPayload {
  const sw = Number(next.flags.lastSeasonWins ?? 0);
  const sl = Number(next.flags.lastSeasonLosses ?? 0);
  return {
    vibe: 'season',
    title: `Temporada ${next.season - 1} cerrada`,
    beats: [
      next.lastNotice ?? 'Se acabó el split.',
      `Marcas: ${sw}V–${sl}D · $${next.cash} en cuenta.`,
      next.ageYears >= 35
        ? `Tenés ${next.ageYears} años. El cuerpo pide retiro — o una temporada más.`
        : `Tenés ${next.ageYears} años. ¿Seguís o colgás los periféricos?`,
    ],
  };
}

function routeAfterCareer(next: CareerState): Screen {
  if (next.endingId) return 'ending';
  if (next.phase === 'seasonBreak') return 'seasonBreak';
  if (next.phase === 'match') return 'match';
  if (next.phase === 'event') return 'play';
  return 'weekHub';
}

export const useGameStore = create<GameStore>((set, get) => ({
  pack: esportsPack,
  screen: 'home',
  career: null,
  draft: { ...defaultDraft },
  activeMinigame: null,
  cinematic: null,
  matchPhase: 'live',
  npcTalk: null,

  setScreen: (screen) => set({ screen }),

  setDraft: (p) => set({ draft: { ...get().draft, ...p } }),

  dismissCinematic: () => set({ cinematic: null }),

  talkToNpc: (kind, line) => {
    const { career, pack } = get();
    if (!career) {
      set({ npcTalk: line });
      return;
    }
    const action = career.npcStates[kind].pendingAction;
    const prompted = openNpcActionSituation(pack, career, kind);
    if (prompted) {
      set({ career: prompted, screen: 'play', npcTalk: null });
      return;
    }
    let next = markNpcMet(career, kind);
    if (action === 'avoid') {
      next = {
        ...next,
        relations: {
          ...next.relations,
          [kind]: Math.max(0, next.relations[kind] - 2),
        },
        lastNotice: `${next.roster[kind].name} evitó la conversación. La distancia se nota.`,
      };
    }
    set({ career: next, npcTalk: line });
  },
  clearNpcTalk: () => set({ npcTalk: null }),

  softFail: (notice) => {
    const { career } = get();
    if (!career) return;
    set({
      career: {
        ...career,
        stats: {
          ...career.stats,
          mentality: Math.max(0, (career.stats.mentality ?? 0) - 2),
        },
        lastNotice: notice,
      },
    });
  },

  switchRole: (roleId) => {
    const { pack, career } = get();
    if (!career) return;
    set({ career: applyRoleSwitch(pack, career, roleId) });
  },

  startCareer: () => {
    const { pack, draft } = get();
    if (!draft.nationId || !draft.roleId) return;
    const nation = pack.nations.find((n) => n.id === draft.nationId);
    const role = pack.roles.find((r) => r.id === draft.roleId);
    const career = createCareer(pack, {
      name: draft.name || 'Prodigy',
      nationId: draft.nationId,
      roleId: draft.roleId,
      durationId: 'season',
    });
    set({
      career,
      screen: 'weekHub',
      activeMinigame: null,
      matchPhase: 'live',
      npcTalk: null,
      cinematic: {
        vibe: 'kickoff',
        title: `${career.profile.name} entra al grind`,
        beats: [
          `${nation?.name ?? ''} · ${role?.name ?? draft.roleId?.toUpperCase()} · ${career.ageYears} años.`,
          role?.stakes ??
            'Tu rol define cómo crecés, cómo jugás las series y cómo te lee el circuito.',
          'Tocá objetos, viajá por la ciudad, hablá con tu gente.',
        ],
      },
    });
  },

  pickActivity: (activityId) => {
    const { pack, career } = get();
    if (!career || career.endingId || career.phase === 'seasonBreak') return;
    const outcome = applyWeekActivity(pack, career, activityId);
    let next = outcome.state;

    if (outcome.kind === 'ending') {
      set({ career: next, screen: 'ending', cinematic: endingCinematic(pack, next) });
      return;
    }

    if (outcome.kind === 'season') {
      set({
        career: next,
        screen: 'seasonBreak',
        cinematic: seasonCinematic(next),
      });
      return;
    }

    if (outcome.kind === 'slot') {
      set({ career: next, screen: 'weekHub', npcTalk: null });
      return;
    }

    const promo = maybePromotionCinematic(pack, career, next);

    if (outcome.kind === 'match') {
      set({
        career: next,
        screen: 'match',
        matchPhase: 'live',
        cinematic:
          promo ??
          ({
            vibe: 'match',
            title: 'MATCH DAY',
            subtitle: next.lastNotice ?? 'Draft room en 3…',
            durationMs: 1600,
          } as CinematicPayload),
      });
      return;
    }

    next = openEvent(pack, next);
    set({ career: next, screen: 'play', cinematic: promo });
  },

  resolveLiveMatch: (choices, opponent) => {
    const { career } = get();
    if (!career) return;
    const { state: afterMatch } = resolveMatch(career, choices, opponent);
    set({ career: afterMatch, screen: 'match', matchPhase: 'result' });
  },

  continueAfterMatch: () => {
    const { pack, career } = get();
    if (!career) return;

    const promoted = maybePromote({ ...career, phase: 'event' });
    const promo = maybePromotionCinematic(pack, career, promoted);

    if (promoted.weekInSeason >= promoted.maxTurns) {
      const roll = nextRng(promoted.rngSeed);
      const closed = closeSeason({ ...promoted, rngSeed: roll.seed });
      const forced = maybeForceRetire(closed, roll.value);
      if (forced) {
        set({ career: forced, screen: 'ending', cinematic: endingCinematic(pack, forced) });
        return;
      }
      set({ career: closed, screen: 'seasonBreak', cinematic: seasonCinematic(closed) });
      return;
    }

    const next = openEvent(pack, promoted);
    set({
      career: next,
      screen: routeAfterCareer(next),
      matchPhase: 'live',
      cinematic: next.endingId ? endingCinematic(pack, next) : promo,
    });
  },

  choose: (choiceId) => {
    const { pack, career } = get();
    if (!career) return;
    const next = applyChoice(pack, career, choiceId);
    const promo = maybePromotionCinematic(pack, career, next);

    set({
      career: next,
      activeMinigame: null,
      screen: routeAfterCareer(next),
      cinematic: next.endingId ? endingCinematic(pack, next) : promo,
    });
  },

  enterMinigame: () => {
    const { pack, career } = get();
    if (!career?.currentEventId) return;
    const event = currentPlayableEvent(pack, career);
    const mg = career.currentSituation?.minigame ?? event?.minigame;
    if (!mg) return;
    set({
      activeMinigame: mg,
      screen: 'minigame',
      cinematic: {
        vibe: 'skill',
        title: mg.title,
        subtitle: mg.blurb,
        durationMs: 1800,
      },
    });
  },

  completeMinigame: (grade) => {
    const { pack, career } = get();
    if (!career) return;
    const next = applyMinigameResult(pack, career, grade);
    const promo = maybePromotionCinematic(pack, career, next);

    set({
      career: next,
      activeMinigame: null,
      screen: routeAfterCareer(next),
      cinematic: next.endingId ? endingCinematic(pack, next) : promo,
    });
  },

  buyShopItem: (itemId) => {
    const { career } = get();
    if (!career) return;
    const next = buyItem(career, itemId);
    if (!next) return;
    set({ career: next });
  },

  travel: (venueId) => {
    const { career } = get();
    if (!career || career.endingId || career.phase === 'seasonBreak') return;
    set({ career: travelTo(career, venueId), screen: 'weekHub', npcTalk: null });
  },

  continueNextSeason: () => {
    const { career } = get();
    if (!career) return;
    const next = continueSeason(career);
    set({
      career: next,
      screen: 'weekHub',
      cinematic: {
        vibe: 'season',
        title: `Temporada ${next.season}`,
        subtitle: `${next.ageYears} años · $${next.cash}`,
        durationMs: 1600,
      },
    });
  },

  retireCareer: () => {
    const { pack, career } = get();
    if (!career) return;
    const next = retire(career, false);
    set({
      career: next,
      screen: 'ending',
      cinematic: endingCinematic(pack, next),
    });
  },

  reset: () =>
    set({
      career: null,
      screen: 'home',
      draft: { ...defaultDraft },
      activeMinigame: null,
      cinematic: null,
      matchPhase: 'live',
      npcTalk: null,
    }),
}));
