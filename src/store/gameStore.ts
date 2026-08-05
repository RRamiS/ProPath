import { create } from 'zustand';
import {
  applyChoice,
  applyWeekActivity,
  createCareer,
  openEvent,
  type CareerState,
  type ContentPack,
  type EventMinigame,
  type PlayerProfile,
  type RunDurationId,
  type WeekActivityId,
} from '../engine';
import { esportsPack } from '../content/esports/pack';
import { applyMinigameResult, type MinigameGrade } from '../minigames/applyResult';
import { resolveMatch } from '../match/simulate';

type Screen = 'home' | 'create' | 'weekHub' | 'play' | 'match' | 'minigame' | 'ending';

export type CinematicPayload = {
  title: string;
  subtitle?: string;
  vibe: 'kickoff' | 'promote' | 'skill' | 'ending' | 'match';
  durationMs?: number;
};

interface GameStore {
  pack: ContentPack;
  screen: Screen;
  career: CareerState | null;
  draft: Partial<PlayerProfile>;
  activeMinigame: EventMinigame | null;
  cinematic: CinematicPayload | null;
  setScreen: (s: Screen) => void;
  setDraft: (p: Partial<PlayerProfile>) => void;
  startCareer: () => void;
  pickActivity: (activityId: WeekActivityId) => void;
  resolveLiveMatch: (choices: string[], opponent: string) => void;
  choose: (choiceId: string) => void;
  enterMinigame: () => void;
  completeMinigame: (grade: MinigameGrade) => void;
  dismissCinematic: () => void;
  reset: () => void;
}

const defaultDraft: Partial<PlayerProfile> = {
  name: '',
  nationId: 'ar',
  roleId: 'mid',
  durationId: 'season',
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
  return {
    vibe: 'promote',
    title: stageLabel(pack, next.stageId),
    subtitle: next.lastNotice ?? 'Subís de nivel en el circuito.',
    durationMs: 2800,
  };
}

function routeAfterCareer(next: CareerState): Screen {
  if (next.endingId) return 'ending';
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

  setScreen: (screen) => set({ screen }),

  setDraft: (p) => set({ draft: { ...get().draft, ...p } }),

  dismissCinematic: () => set({ cinematic: null }),

  startCareer: () => {
    const { pack, draft } = get();
    if (!draft.nationId || !draft.roleId) return;
    const durationId = (draft.durationId ?? 'season') as RunDurationId;
    const nation = pack.nations.find((n) => n.id === draft.nationId);
    const career = createCareer(pack, {
      name: draft.name || 'Prodigy',
      nationId: draft.nationId,
      roleId: draft.roleId,
      durationId,
    });
    set({
      career,
      screen: 'weekHub',
      activeMinigame: null,
      cinematic: {
        vibe: 'kickoff',
        title: `${career.profile.name} entra al grind`,
        subtitle: `${nation?.flag ?? ''} ${nation?.name ?? ''} · ${draft.roleId?.toUpperCase()} · ${durationId}`,
        durationMs: 3000,
      },
    });
  },

  pickActivity: (activityId) => {
    const { pack, career } = get();
    if (!career || career.endingId) return;
    const outcome = applyWeekActivity(pack, career, activityId);
    let next = outcome.state;

    if (outcome.kind === 'ending') {
      const ending = pack.endings.find((e) => e.id === next.endingId);
      set({
        career: next,
        screen: 'ending',
        cinematic: {
          vibe: 'ending',
          title: ending?.title ?? 'Fin',
          subtitle: ending?.body,
          durationMs: 999999,
        },
      });
      return;
    }

    const promo = maybePromotionCinematic(pack, career, next);

    if (outcome.kind === 'match') {
      set({
        career: next,
        screen: 'match',
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
    set({
      career: next,
      screen: 'play',
      cinematic: promo,
    });
  },

  resolveLiveMatch: (choices, opponent) => {
    const { pack, career } = get();
    if (!career) return;
    const { state: afterMatch } = resolveMatch(career, choices, opponent);
    let next = openEvent(pack, { ...afterMatch, phase: 'event' });
    const promo = maybePromotionCinematic(pack, career, next);
    const ending = pack.endings.find((e) => e.id === next.endingId);

    if (next.endingId) {
      set({
        career: next,
        screen: 'ending',
        cinematic: {
          vibe: 'ending',
          title: ending?.title ?? 'Fin',
          subtitle: ending?.body,
          durationMs: 999999,
        },
      });
      return;
    }

    set({
      career: next,
      screen: 'play',
      cinematic:
        promo ??
        ({
          vibe: 'match',
          title: next.lastMatch?.won ? 'VICTORIA' : 'DERROTA',
          subtitle: next.lastNotice ?? undefined,
          durationMs: 2000,
        } as CinematicPayload),
    });
  },

  choose: (choiceId) => {
    const { pack, career } = get();
    if (!career) return;
    const next = applyChoice(pack, career, choiceId);
    const promo = maybePromotionCinematic(pack, career, next);
    const ending = pack.endings.find((e) => e.id === next.endingId);

    set({
      career: next,
      activeMinigame: null,
      screen: routeAfterCareer(next),
      cinematic: next.endingId
        ? {
            vibe: 'ending',
            title: ending?.title ?? 'Fin',
            subtitle: ending?.body,
            durationMs: 999999,
          }
        : promo,
    });
  },

  enterMinigame: () => {
    const { pack, career } = get();
    if (!career?.currentEventId) return;
    const event = pack.events.find((e) => e.id === career.currentEventId);
    if (!event?.minigame) return;
    set({
      activeMinigame: event.minigame,
      screen: 'minigame',
      cinematic: {
        vibe: 'skill',
        title: event.minigame.title,
        subtitle: event.minigame.blurb,
        durationMs: 1800,
      },
    });
  },

  completeMinigame: (grade) => {
    const { pack, career } = get();
    if (!career) return;
    const next = applyMinigameResult(pack, career, grade);
    const promo = maybePromotionCinematic(pack, career, next);
    const ending = pack.endings.find((e) => e.id === next.endingId);

    set({
      career: next,
      activeMinigame: null,
      screen: routeAfterCareer(next),
      cinematic: next.endingId
        ? {
            vibe: 'ending',
            title: ending?.title ?? 'Fin',
            subtitle: ending?.body,
            durationMs: 999999,
          }
        : promo,
    });
  },

  reset: () =>
    set({
      career: null,
      screen: 'home',
      draft: { ...defaultDraft },
      activeMinigame: null,
      cinematic: null,
    }),
}));
