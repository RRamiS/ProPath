/**
 * Identidad de rol: no es un label, es una apuesta de carrera.
 * Maestría crece jugando on-role; cambiar de carril tiene precio y payoff.
 */
import type {
  CareerState,
  ContentPack,
  Role,
  Stats,
  WeekActivityId,
} from './types';
import { applyStatDelta } from './createCareer';
import { buildRoster } from '../content/esports/roster';

/** Tras un switch, bloquea otro hasta el próximo season break. */
export const ROLE_SWITCH_COOLDOWN_SEASONS = 1;

export function getRole(pack: ContentPack, roleId: string): Role | undefined {
  return pack.roles.find((r) => r.id === roleId);
}

export function roleMasteryOf(state: CareerState, roleId = state.profile.roleId): number {
  return state.roleMastery?.[roleId] ?? 0;
}

/** 0..1 — cuánto “sos” tu rol actual. */
export function masteryFactor(state: CareerState): number {
  return Math.max(0, Math.min(1, roleMasteryOf(state) / 100));
}

export function gainRoleMastery(
  state: CareerState,
  amount: number,
  roleId = state.profile.roleId
): CareerState {
  if (amount <= 0) return state;
  const current = state.roleMastery[roleId] ?? 0;
  // Soft cap: cerca de 100 cuesta más.
  const soft = current >= 80 ? amount * 0.45 : current >= 60 ? amount * 0.7 : amount;
  const next = Math.max(0, Math.min(100, Math.round(current + soft)));
  if (next === current) return state;
  return {
    ...state,
    roleMastery: { ...state.roleMastery, [roleId]: next },
  };
}

/** Bonus de stats primarios al entrenar / jugar on-role. */
export function roleTrainingBoost(
  pack: ContentPack,
  state: CareerState,
  activityId: WeekActivityId
): Partial<Stats> {
  const role = getRole(pack, state.profile.roleId);
  if (!role) return {};
  const m = masteryFactor(state);
  const out: Partial<Stats> = {};

  // Actividad firma del rol: más crecimiento.
  const signature = activityId === role.signatureActivity;
  const scale = (signature ? 1.6 : activityId === 'match' ? 1.2 : 0.55) * (0.55 + m * 0.7);

  for (const key of role.primaryStats) {
    out[key] = Math.max(1, Math.round((signature ? 2 : 1) * scale));
  }
  return out;
}

/** Empuje de llamadas de partido según el rol y la maestría. */
export function roleCallBonus(
  pack: ContentPack,
  state: CareerState,
  choiceId: string
): number {
  const role = getRole(pack, state.profile.roleId);
  if (!role) return 0;
  const m = masteryFactor(state);
  if (role.signatureCalls.includes(choiceId)) {
    return 0.18 + m * 0.42; // hasta ~0.6 con maestría alta
  }
  // Off-signature con poca maestría: se nota la torpeza.
  if (m < 0.35) return -0.12;
  return 0;
}

export function canSwitchRole(state: CareerState): { ok: boolean; reason?: string } {
  if (state.phase !== 'seasonBreak') {
    return { ok: false, reason: 'Solo podés cambiar de rol entre splits.' };
  }
  if ((state.roleSwitchCooldown ?? 0) > 0) {
    return { ok: false, reason: 'El staff todavía no digiere el último cambio.' };
  }
  if (state.roleSwitches >= 3) {
    return { ok: false, reason: 'Demasiados cambios: el circuito ya no te lee.' };
  }
  return { ok: true };
}

export function roleSwitchCost(state: CareerState): number {
  const stage =
    state.stageId === 'worlds'
      ? 5
      : state.stageId === 'tier1'
        ? 4
        : state.stageId === 'challengers'
          ? 3
          : state.stageId === 'academy'
            ? 2
            : 1;
  return 60 + stage * 35 + state.roleSwitches * 40;
}

/**
 * Cambio de rol: payoff (flex + arranque limpio) y costo (plata, forma, confianza, maestría).
 */
export function switchRole(
  pack: ContentPack,
  state: CareerState,
  newRoleId: string
): CareerState {
  const gate = canSwitchRole(state);
  if (!gate.ok) {
    return { ...state, lastNotice: gate.reason ?? 'No podés cambiar de rol ahora.' };
  }
  if (newRoleId === state.profile.roleId) return state;

  const nextRole = getRole(pack, newRoleId);
  if (!nextRole) {
    return { ...state, lastNotice: 'Rol inválido.' };
  }

  const cost = roleSwitchCost(state);
  if (state.cash < cost) {
    return {
      ...state,
      lastNotice: `Cambio a ${nextRole.name} cuesta $${cost}. Te faltan fondos.`,
    };
  }

  const oldId = state.profile.roleId;
  const oldMastery = state.roleMastery[oldId] ?? 0;
  const keptOld = Math.round(oldMastery * 0.65);
  const seedNew = Math.max(
    12,
    Math.min(40, Math.round((state.roleMastery[newRoleId] ?? 0) * 0.85 + oldMastery * 0.18))
  );

  const roster = buildRoster(state.profile.nationId, newRoleId);

  let next: CareerState = {
    ...state,
    cash: state.cash - cost,
    profile: { ...state.profile, roleId: newRoleId },
    previousRoleId: oldId,
    roleSwitches: state.roleSwitches + 1,
    roleSwitchCooldown: ROLE_SWITCH_COOLDOWN_SEASONS,
    roleMastery: {
      ...state.roleMastery,
      [oldId]: keptOld,
      [newRoleId]: seedNew,
    },
    flags: {
      ...state.flags,
      role: newRoleId,
      roleFlex: true,
      lastRoleSwitch: state.season,
    },
    form: Math.max(0, state.form - 14),
    fatigue: Math.min(100, state.fatigue + 8),
    stats: applyStatDelta(state.stats, {
      mentality: -5,
      reputation: state.stageId === 'soloq' || state.stageId === 'academy' ? 4 : -2,
    }),
    relations: {
      ...state.relations,
      coach: clamp(state.relations.coach - 10),
      manager: clamp(state.relations.manager - 8),
      duo: clamp(state.relations.duo - 6),
      rival: clamp(state.relations.rival + 5),
    },
    roster: {
      ...roster,
      // El coach/manager del org se mantienen; el duo/rival se rehacen con el nuevo rol.
      coach: state.roster.coach,
      manager: state.roster.manager,
    },
    lastNotice: `Cambiás a ${nextRole.name}. −$${cost}. El staff duda — tu maestría arranca en ${seedNew}.`,
    ticker: [
      `ROL · ${oldId.toUpperCase()} → ${newRoleId.toUpperCase()}`,
      `−$${cost}`,
      `Maestría ${nextRole.name}: ${seedNew}`,
      ...state.ticker,
    ].slice(0, 8),
  };

  return next;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
