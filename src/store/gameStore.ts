import { create } from 'zustand';
import {
  advanceToEvent,
  applyChoice,
  createCareer,
  type CareerState,
  type ContentPack,
  type EventMinigame,
  type PlayerProfile,
  type RunDurationId,
} from '../engine';
import { esportsPack } from '../content/esports/pack';
import { applyMinigameResult, type MinigameGrade } from '../minigames/applyResult';

type Screen = 'home' | 'create' | 'play' | 'minigame' | 'ending';

export type CinematicPayload = {
  title: string;
  subtitle?: string;
  vibe: 'kickoff' | 'promote' | 'skill' | 'ending';
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
    const withEvent = advanceToEvent(pack, career);
    set({
      career: withEvent,
      screen: 'play',
      activeMinigame: null,
      cinematic: {
        vibe: 'kickoff',
        title: `${withEvent.profile.name} entra al grind`,
        subtitle: `${nation?.flag ?? ''} ${nation?.name ?? ''} · ${draft.roleId?.toUpperCase()} · ${durationId}`,
        durationMs: 3000,
      },
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
      screen: next.endingId ? 'ending' : 'play',
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
      screen: next.endingId ? 'ending' : 'play',
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
