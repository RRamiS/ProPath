import { create } from 'zustand';
import {
  applyChoice,
  applyWeekActivity,
  createCareer,
  maybePromote,
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

/** El partido tiene fases interactivas y luego la pantalla de resultado. */
type MatchPhase = 'live' | 'result';

export type CinematicPayload = {
  title: string;
  subtitle?: string;
  /** Líneas que el jugador avanza tocando; reemplazan al subtítulo. */
  beats?: string[];
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
  matchPhase: MatchPhase;
  setScreen: (s: Screen) => void;
  setDraft: (p: Partial<PlayerProfile>) => void;
  startCareer: () => void;
  pickActivity: (activityId: WeekActivityId) => void;
  resolveLiveMatch: (choices: string[], opponent: string) => void;
  continueAfterMatch: () => void;
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
  const label = stageLabel(pack, next.stageId);
  return {
    vibe: 'promote',
    title: label,
    beats: [
      next.lastNotice ?? 'El circuito te abre la puerta.',
      `Nuevo escenario: ${label}. Los rivales ya no fallan las que fallabas vos.`,
      `Semana ${next.turn} · ${next.wins}V–${next.losses}D. A partir de acá, cada serie pesa.`,
    ],
  };
}

function endingCinematic(pack: ContentPack, next: CareerState): CinematicPayload {
  const ending = pack.endings.find((e) => e.id === next.endingId);
  return {
    vibe: 'ending',
    title: ending?.title ?? 'Fin',
    beats: [
      ending?.body ?? 'Se cierra el ciclo.',
      `Cerraste con ${next.wins}V–${next.losses}D en ${next.turn} semanas.`,
    ],
    durationMs: 999999,
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
  matchPhase: 'live',

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
      matchPhase: 'live',
      cinematic: {
        vibe: 'kickoff',
        title: `${career.profile.name} entra al grind`,
        beats: [
          `${nation?.name ?? ''} · ${draft.roleId?.toUpperCase()}. Nadie te conoce todavía.`,
          'Cada semana elegís una sola cosa: entrenar, competir o cuidar la cabeza.',
          'Nada es gratis. La forma sube, la fatiga también.',
        ],
      },
    });
  },

  pickActivity: (activityId) => {
    const { pack, career } = get();
    if (!career || career.endingId) return;
    const outcome = applyWeekActivity(pack, career, activityId);
    let next = outcome.state;

    if (outcome.kind === 'ending') {
      set({ career: next, screen: 'ending', cinematic: endingCinematic(pack, next) });
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

  /** Cierra las fases interactivas y deja la pantalla de resultado del partido. */
  resolveLiveMatch: (choices, opponent) => {
    const { career } = get();
    if (!career) return;
    const { state: afterMatch } = resolveMatch(career, choices, opponent);
    set({ career: afterMatch, screen: 'match', matchPhase: 'result' });
  },

  /** Del resultado del partido al evento narrativo de esa semana. */
  continueAfterMatch: () => {
    const { pack, career } = get();
    if (!career) return;

    const promoted = maybePromote({ ...career, phase: 'event' });
    const promo = maybePromotionCinematic(pack, career, promoted);
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

    set({
      career: next,
      activeMinigame: null,
      screen: routeAfterCareer(next),
      cinematic: next.endingId ? endingCinematic(pack, next) : promo,
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
    }),
}));
