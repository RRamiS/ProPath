import { create } from 'zustand';
import {
  applyChoice,
  applyObjectiveClaims,
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
import { resolveSeasonOffer, type SeasonOfferId } from '../engine/season';
import {
  tryOpenMidSeasonBeat,
  tryOpenRivalAftermathBeat,
} from '../engine/situationDirector';
import {
  applyTalkChoice,
  pickTalkBeat,
  type TalkSession,
} from '../engine/talkBeats';
import { esportsPack } from '../content/esports/pack';
import { applyMinigameResult, type MinigameGrade } from '../minigames/applyResult';
import { resolveMatch } from '../match/simulate';
import { markNpcMet } from '../engine/npcDirector';
import { currentPlayableEvent } from '../engine/applyChoice';
import {
  clearSave,
  loadSave,
  saveGame,
  summarizeSave,
  toSaveScreen,
  type SaveSummary,
} from './persist';

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
  vibe: 'kickoff' | 'promote' | 'skill' | 'ending' | 'match' | 'season' | 'rivalry';
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
  talkSession: TalkSession | null;
  /** True cuando ya se intentó leer el save al boot. */
  hydrated: boolean;
  saveSummary: SaveSummary | null;
  setScreen: (s: Screen) => void;
  setDraft: (p: Partial<PlayerProfile>) => void;
  hydrate: () => Promise<void>;
  continueCareer: () => Promise<void>;
  /** Menú: vuelve al home sin borrar el save. */
  goHome: () => Promise<void>;
  startCareer: () => void;
  switchRole: (roleId: string) => void;
  pickActivity: (activityId: WeekActivityId, variantId?: string, variantOk?: boolean) => void;
  resolveLiveMatch: (choices: string[], opponent: string, seriesMomentum?: number) => void;
  continueAfterMatch: () => void;
  choose: (choiceId: string) => void;
  enterMinigame: () => void;
  completeMinigame: (grade: MinigameGrade) => void;
  dismissNotice: () => void;
  dismissCinematic: () => void;
  buyShopItem: (itemId: string) => void;
  travel: (venueId: VenueId) => void;
  continueNextSeason: () => void;
  /** Oferta de fin de split (SeasonBreak). */
  resolveSeasonOfferChoice: (choiceId: SeasonOfferId) => void;
  retireCareer: () => void;
  talkToNpc: (kind: RelationKey, line?: string) => void;
  chooseTalk: (choiceId: string, success?: boolean) => void;
  clearTalk: () => void;
  completeOnboard: () => void;
  /** Vuelve a mostrar el coach en el hub (playtest / rejugable). */
  replayHowTo: () => void;
  softFail: (notice: string) => void;
  /** Nueva carrera: borra save. */
  reset: () => void;
  /** Borra el save del disco (playtest). */
  deleteSave: () => Promise<void>;
  /**
   * Atrás de Android. true = consumido (no salir de la app).
   * false = en home: el sistema puede cerrar.
   */
  handleHardwareBack: () => boolean;
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
  const grade = String(next.flags.seasonReviewGrade ?? 'ok').toUpperCase();
  return {
    vibe: 'season',
    title: `Temporada ${next.season - 1} cerrada`,
    beats: [
      next.lastNotice ?? 'Se acabó el split.',
      `Marcas: ${sw}V–${sl}D · review ${grade} · $${next.cash}.`,
      'El staff tiene una oferta. Después decidís si seguís.',
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

/** Reconciliar save viejo / desync screen↔phase al continuar. */
function reconcileContinueScreen(
  career: CareerState,
  saved: Screen
): { screen: Screen; matchPhase: MatchPhase } {
  if (career.endingId) return { screen: 'ending', matchPhase: 'live' };
  if (career.phase === 'seasonBreak') return { screen: 'seasonBreak', matchPhase: 'live' };
  if (career.phase === 'match') {
    return { screen: 'match', matchPhase: 'live' };
  }
  if (
    career.phase === 'event' &&
    (career.currentSituation || career.currentEventId)
  ) {
    return { screen: 'play', matchPhase: 'live' };
  }
  if (saved === 'play' && !career.currentEventId && !career.currentSituation) {
    return { screen: 'weekHub', matchPhase: 'live' };
  }
  // phase ya no es match (se manejó arriba): un save "match" huérfano vuelve al hub.
  if (saved === 'match') {
    return { screen: 'weekHub', matchPhase: 'live' };
  }
  return { screen: saved === 'home' || saved === 'create' ? 'weekHub' : saved, matchPhase: 'live' };
}

function closeSeasonFlow(
  pack: ContentPack,
  state: CareerState
): { career: CareerState; screen: Screen; cinematic: CinematicPayload | null } {
  const roll = nextRng(state.rngSeed);
  const closed = closeSeason({ ...state, rngSeed: roll.seed });
  const forced = maybeForceRetire(closed, roll.value);
  if (forced) {
    return {
      career: forced,
      screen: 'ending',
      cinematic: endingCinematic(pack, forced),
    };
  }
  return {
    career: closed,
    screen: 'seasonBreak',
    cinematic: seasonCinematic(closed),
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  pack: esportsPack,
  screen: 'home',
  career: null,
  draft: { ...defaultDraft },
  activeMinigame: null,
  cinematic: null,
  matchPhase: 'live',
  talkSession: null,
  hydrated: false,
  saveSummary: null,

  setScreen: (screen) => set({ screen }),

  setDraft: (p) => set({ draft: { ...get().draft, ...p } }),

  hydrate: async () => {
    const save = await loadSave();
    set({
      hydrated: true,
      saveSummary: save ? summarizeSave(save) : null,
    });
  },

  continueCareer: async () => {
    const save = await loadSave();
    if (!save) {
      set({ saveSummary: null });
      return;
    }
    const reconciled = reconcileContinueScreen(save.career, save.screen);
    set({
      career: save.career,
      screen: reconciled.screen,
      matchPhase:
        reconciled.screen === 'match' ? save.matchPhase || reconciled.matchPhase : 'live',
      talkSession: null,
      activeMinigame: null,
      cinematic: null,
      saveSummary: summarizeSave(save),
    });
  },

  goHome: async () => {
    const { career, screen, matchPhase } = get();
    const playable = toSaveScreen(screen);
    if (career) {
      await saveGame({ career, screen: playable, matchPhase });
    }
    set({
      screen: 'home',
      talkSession: null,
      cinematic: null,
      activeMinigame: null,
      saveSummary: career
        ? summarizeSave({
            version: 1,
            savedAt: Date.now(),
            career,
            screen: playable,
            matchPhase,
          })
        : get().saveSummary,
    });
  },

  dismissCinematic: () => set({ cinematic: null }),

  talkToNpc: (kind) => {
    const { career, pack } = get();
    if (!career) return;
    const action = career.npcStates[kind].pendingAction;
    const prompted = openNpcActionSituation(pack, career, kind);
    if (prompted) {
      set({ career: prompted, screen: 'play', talkSession: null });
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
      set({ career: next, talkSession: null });
      return;
    }
    const { session, seed } = pickTalkBeat(next, kind);
    set({
      career: { ...next, rngSeed: seed },
      talkSession: session,
    });
  },

  chooseTalk: (choiceId, success = true) => {
    const { career, talkSession } = get();
    if (!career || !talkSession) return;
    const next = applyTalkChoice(career, talkSession, choiceId, success);
    set({ career: next, talkSession: null });
  },

  clearTalk: () => set({ talkSession: null }),

  completeOnboard: () => {
    const { career } = get();
    if (!career) return;
    set({
      career: {
        ...career,
        flags: { ...career.flags, onboardDone: 1, howtoReplay: 0 },
      },
    });
  },

  replayHowTo: () => {
    const { career } = get();
    if (!career) return;
    set({
      career: {
        ...career,
        flags: { ...career.flags, onboardDone: 0, howtoReplay: 1 },
      },
      screen: 'weekHub',
      talkSession: null,
      cinematic: null,
      activeMinigame: null,
    });
  },

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
      talkSession: null,
      cinematic: {
        vibe: 'kickoff',
        title: `${career.profile.name} entra al grind`,
        beats: [
          `${nation?.name ?? ''} · ${role?.name ?? draft.roleId?.toUpperCase()} · ${career.ageYears} años.`,
          role?.stakes ??
            'Tu rol define cómo crecés, cómo jugás las series y cómo te lee el circuito.',
          'Tocá un objeto → elegí entre 3 → si pide skill, ejecutalo.',
          'Abrí el MAPA: vas a ver quién está en cada sede.',
        ],
      },
    });
    void saveGame({
      career,
      screen: 'weekHub',
      matchPhase: 'live',
    }).then(async () => {
      const save = await loadSave();
      set({ saveSummary: save ? summarizeSave(save) : null });
    });
  },

  pickActivity: (activityId, variantId, variantOk = true) => {
    const { pack, career } = get();
    if (!career || career.endingId || career.phase === 'seasonBreak') return;
    const outcome = applyWeekActivity(pack, career, activityId, variantId, variantOk);
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
      set({ career: next, screen: 'weekHub', talkSession: null });
      return;
    }

    const promo = maybePromotionCinematic(pack, career, next);

    if (outcome.kind === 'match') {
      const showdown = Number(next.flags.rivalShowdownPending ?? 0) === 1;
      set({
        career: next,
        screen: 'match',
        matchPhase: 'live',
        cinematic:
          promo ??
          ({
            vibe: 'match',
            title: showdown ? 'SHOWDOWN' : 'MATCH DAY',
            subtitle: showdown
              ? `vs ${next.roster.rival.name} · esto es personal`
              : next.lastNotice ?? 'Draft room en 3…',
            durationMs: 1600,
          } as CinematicPayload),
      });
      return;
    }

    const mid = tryOpenMidSeasonBeat(next);
    next = mid ?? openEvent(pack, next);
    set({
      career: next,
      screen: 'play',
      cinematic:
        mid
          ? {
              vibe: 'season',
              title: 'Mitad de split',
              beats: [
                'El staff corta el ritmo a mitad de camino.',
                'Lo que elijas pesa el resto de la temporada.',
              ],
              durationMs: 2000,
            }
          : promo,
    });
  },

  resolveLiveMatch: (choices, opponent, seriesMomentum = 50) => {
    const { career } = get();
    if (!career) return;
    const { state: afterMatch } = resolveMatch(career, choices, opponent, seriesMomentum);
    set({
      career: applyObjectiveClaims(afterMatch),
      screen: 'match',
      matchPhase: 'result',
    });
  },

  dismissNotice: () => {
    const { career } = get();
    if (!career?.lastNotice) return;
    set({ career: { ...career, lastNotice: null } });
  },

  continueAfterMatch: () => {
    const { pack, career } = get();
    if (!career) return;

    const promoted = maybePromote({ ...career, phase: 'event' });
    const promo = maybePromotionCinematic(pack, career, promoted);

    // Cierre del showdown antes que mid-season / fin de split.
    const aftermath = tryOpenRivalAftermathBeat(promoted);
    if (aftermath) {
      const won = Number(aftermath.flags.rivalShowdownWon ?? 0) === 1;
      const seasonDue = promoted.weekInSeason >= promoted.maxTurns;
      set({
        career: seasonDue
          ? {
              ...aftermath,
              flags: { ...aftermath.flags, pendingSeasonClose: 1 },
            }
          : aftermath,
        screen: routeAfterCareer(aftermath),
        matchPhase: 'live',
        cinematic: {
          vibe: 'rivalry',
          title: won ? 'Después del showdown' : 'La cuenta pendiente',
          beats: [
            won
              ? 'El scoreboard habló. El rival todavía tiene algo que decir.'
              : 'Perdiste la serie personal. El circuito no olvida.',
          ],
          durationMs: 2000,
        },
      });
      return;
    }

    if (promoted.weekInSeason >= promoted.maxTurns) {
      const closed = closeSeasonFlow(pack, promoted);
      set({
        career: closed.career,
        screen: closed.screen,
        cinematic: closed.cinematic,
      });
      return;
    }

    const mid = tryOpenMidSeasonBeat(promoted);
    const next = mid ?? openEvent(pack, promoted);
    set({
      career: next,
      screen: routeAfterCareer(next),
      matchPhase: 'live',
      cinematic: next.endingId
        ? endingCinematic(pack, next)
        : mid
          ? {
              vibe: 'season',
              title: 'Mitad de split',
              beats: [
                'Tras la serie, el staff pide un check-in.',
                'Mitad de camino: elegí cómo cerrar el split.',
              ],
              durationMs: 2000,
            }
          : promo,
    });
  },

  choose: (choiceId) => {
    const { pack, career } = get();
    if (!career) return;
    let next = applyChoice(pack, career, choiceId);
    const promo = maybePromotionCinematic(pack, career, next);

    // Aftermath (u otro beat) que aplazó el cierre de split.
    if (
      !next.endingId &&
      next.phase === 'hub' &&
      Number(next.flags.pendingSeasonClose ?? 0) === 1
    ) {
      const closed = closeSeasonFlow(pack, {
        ...next,
        flags: { ...next.flags, pendingSeasonClose: 0 },
      });
      set({
        career: closed.career,
        activeMinigame: null,
        screen: closed.screen,
        cinematic: closed.cinematic,
      });
      return;
    }

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
    const next = travelTo(career, venueId);
    const moved = next.venueId === venueId;
    set({
      career: next,
      screen: moved ? 'weekHub' : 'city',
      talkSession: null,
    });
  },

  continueNextSeason: () => {
    const { career } = get();
    if (!career) return;
    if (career.flags.seasonOfferPending) return;
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

  resolveSeasonOfferChoice: (choiceId) => {
    const { career } = get();
    if (!career) return;
    set({ career: resolveSeasonOffer(career, choiceId) });
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

  reset: () => {
    void clearSave();
    set({
      career: null,
      screen: 'home',
      draft: { ...defaultDraft },
      activeMinigame: null,
      cinematic: null,
      matchPhase: 'live',
      talkSession: null,
      saveSummary: null,
    });
  },

  deleteSave: async () => {
    await clearSave();
    set({
      career: null,
      screen: 'home',
      draft: { ...defaultDraft },
      activeMinigame: null,
      cinematic: null,
      matchPhase: 'live',
      talkSession: null,
      saveSummary: null,
    });
  },

  handleHardwareBack: () => {
    const s = get();

    if (s.cinematic) {
      // Ending cinematic es largo a propósito; atrás vuelve al menú.
      if (s.cinematic.vibe === 'ending') {
        void get().goHome();
        return true;
      }
      set({ cinematic: null });
      return true;
    }

    if (s.talkSession) {
      set({ talkSession: null });
      return true;
    }

    switch (s.screen) {
      case 'create':
        set({ screen: 'home' });
        return true;
      case 'shop':
      case 'city':
        set({ screen: 'weekHub' });
        return true;
      case 'play': {
        const arch = s.career?.currentSituation?.archetypeId;
        const forcedBeat =
          arch === 'rival_aftermath_win' ||
          arch === 'rival_aftermath_loss' ||
          arch === 'mid_season_checkin';
        // Beats de arco: no descartarlos con atrás — volver al menú preservando save.
        if (forcedBeat) {
          void get().goHome();
          return true;
        }
        if (s.career) {
          set({
            career: {
              ...s.career,
              phase: 'hub',
              currentEventId: null,
              currentSituation: null,
            },
            screen: 'weekHub',
            activeMinigame: null,
          });
        } else {
          set({ screen: 'weekHub', activeMinigame: null });
        }
        return true;
      }
      case 'minigame':
        set({
          screen: s.career?.currentSituation || s.career?.currentEventId ? 'play' : 'weekHub',
          activeMinigame: null,
        });
        return true;
      case 'match':
        if (s.matchPhase === 'result') {
          get().continueAfterMatch();
          return true;
        }
        // En vivo: no salir al sistema a mitad de la serie.
        return true;
      case 'seasonBreak':
      case 'weekHub':
      case 'ending':
        void get().goHome();
        return true;
      case 'home':
      default:
        return false;
    }
  },
}));

/** Autosave: cada cambio de carrera / pantalla jugable. */
useGameStore.subscribe((state, prev) => {
  if (!state.hydrated) return;
  if (!state.career) return;
  // No pisar el slot al estar en menú/create (goHome ya guardó la pantalla real).
  if (state.screen === 'home' || state.screen === 'create') return;
  if (
    state.career === prev.career &&
    state.screen === prev.screen &&
    state.matchPhase === prev.matchPhase
  ) {
    return;
  }
  void saveGame({
    career: state.career,
    screen: toSaveScreen(state.screen),
    matchPhase: state.matchPhase,
  });
});