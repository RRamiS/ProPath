import type { PersistedRoster, Relations, RosterMember } from '../../engine/types';

export type RosterNpc = RosterMember;

/** NPCs inventados — sin orgs ni marcas reales. Persistido en CareerState.roster. */
export function buildRoster(nationId: string, roleId: string): PersistedRoster {
  const duoByRole: Record<string, { name: string; role: string }> = {
    mid: { name: 'Nyx', role: 'Jungle' },
    jungle: { name: 'Vera', role: 'Mid' },
    adc: { name: 'Pike', role: 'Support' },
    support: { name: 'Rivena', role: 'ADC' },
    top: { name: 'Kade', role: 'Jungle' },
  };
  const duo = duoByRole[roleId] ?? duoByRole.mid!;

  const rivals: Record<string, string> = {
    ar: 'FrostAR',
    br: 'LoboBR',
    kr: 'Hanul',
    cn: 'QingX',
    us: 'Relay',
    eu: 'NoxEU',
  };

  return {
    coach: {
      id: 'coach',
      name: 'Marek',
      role: 'Coach',
      blurb: 'Ex-analista. Habla poco; el VOD habla por él.',
    },
    duo: {
      id: 'duo',
      name: duo.name,
      role: duo.role,
      blurb: 'Tu pieza de confianza en scrims y ranked.',
    },
    rival: {
      id: 'rival',
      name: rivals[nationId] ?? 'Shade',
      role: roleId.toUpperCase(),
      blurb: 'Misma región, mismo rol. Twitter ya eligió bando.',
    },
    manager: {
      id: 'manager',
      name: 'Sola',
      role: 'Manager',
      blurb: 'Contratos, visas y sponsors. Aparece cuando la cosa se pone seria.',
    },
  };
}

export const DEFAULT_RELATIONS: Relations = {
  coach: 40,
  duo: 45,
  rival: 30,
  manager: 20,
};
