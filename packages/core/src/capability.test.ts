import { describe, expect, it } from 'vitest';

import {
  resolveCapability,
  type CapabilityContext,
  type CapabilityRequirements,
} from './capability.js';

/** Capacité type : exécuter une action externe. */
const executeAction: CapabilityRequirements = {
  permission_level: 'EXECUTE_WITH_CONFIRMATION',
  requires_network: true,
  requires_connector: true,
  degrades_gracefully: false,
};

/** Capacité type : consulter des Cases déjà normalisés. */
const readCases: CapabilityRequirements = {
  permission_level: 'READ',
  requires_network: false,
  requires_connector: false,
  degrades_gracefully: true,
};

const healthy: CapabilityContext = {
  safe_mode: { active: false, blocks_execution: true },
  feature_enabled: true,
  permission: { level: 'EXECUTE_WITH_CONFIRMATION', expired: false, revoked: false },
  connector: 'CONNECTED',
  network: 'ONLINE',
};

const ctx = (overrides: Partial<CapabilityContext>): CapabilityContext => ({
  ...healthy,
  ...overrides,
});

describe('Capacités — cas nominal', () => {
  it('rend AVAILABLE quand tout est réuni', () => {
    expect(resolveCapability(executeAction, healthy)).toEqual({
      state: 'AVAILABLE',
      reason: 'OK',
    });
  });

  it('reste AVAILABLE hors ligne pour une capacité qui n’exige pas le réseau', () => {
    expect(resolveCapability(readCases, ctx({ network: 'OFFLINE' }))).toEqual({
      state: 'AVAILABLE',
      reason: 'OK',
    });
  });
});

describe('Capacités — la raison affichée est la vraie cause', () => {
  it('une permission révoquée prime sur le hors-ligne', () => {
    // Le point central d'ARC-41 : sans cet ordre, l'utilisateur verrait
    // « indisponible hors ligne », se reconnecterait, et ne comprendrait pas
    // pourquoi rien ne change.
    const r = resolveCapability(
      executeAction,
      ctx({
        network: 'OFFLINE',
        permission: { level: 'EXECUTE_WITH_CONFIRMATION', expired: false, revoked: true },
      }),
    );
    expect(r).toEqual({ state: 'BLOCKED', reason: 'PERMISSION_MISSING' });
  });

  it('Safe Mode prime sur la permission et sur le réseau', () => {
    const r = resolveCapability(
      executeAction,
      ctx({
        safe_mode: { active: true, blocks_execution: true },
        network: 'OFFLINE',
        permission: null,
      }),
    );
    expect(r).toEqual({ state: 'BLOCKED', reason: 'SAFE_MODE' });
  });

  it('un connecteur en erreur ne masque pas une permission insuffisante', () => {
    const r = resolveCapability(
      executeAction,
      ctx({ connector: 'ERROR', permission: { level: 'READ', expired: false, revoked: false } }),
    );
    expect(r).toEqual({ state: 'BLOCKED', reason: 'PERMISSION_INSUFFICIENT' });
  });
});

describe('Capacités — Safe Mode', () => {
  it('ne bloque pas une capacité de lecture', () => {
    // SEC-32 : priver l'utilisateur de ses données ne protège personne.
    const r = resolveCapability(
      readCases,
      ctx({
        safe_mode: { active: true, blocks_execution: true },
        permission: { level: 'READ', expired: false, revoked: false },
      }),
    );
    expect(r.state).toBe('AVAILABLE');
  });
});

describe('Capacités — permissions', () => {
  it('bloque une permission absente', () => {
    expect(resolveCapability(executeAction, ctx({ permission: null }))).toEqual({
      state: 'BLOCKED',
      reason: 'PERMISSION_MISSING',
    });
  });

  it('bloque une permission expirée, avec une raison distincte', () => {
    // Expirée et révoquée n'appellent pas la même action utilisateur.
    const r = resolveCapability(
      executeAction,
      ctx({ permission: { level: 'EXECUTE_WITH_CONFIRMATION', expired: true, revoked: false } }),
    );
    expect(r).toEqual({ state: 'BLOCKED', reason: 'PERMISSION_EXPIRED' });
  });

  it('accepte un niveau supérieur au niveau requis', () => {
    const r = resolveCapability(
      executeAction,
      ctx({ permission: { level: 'AUTO_EXECUTE', expired: false, revoked: false } }),
    );
    expect(r.state).toBe('AVAILABLE');
  });
});

describe('Capacités — UNKNOWN n’est pas une valeur de repli', () => {
  it('rend UNKNOWN quand un drapeau n’est pas chargé', () => {
    expect(resolveCapability(executeAction, ctx({ feature_enabled: 'UNKNOWN' }))).toEqual({
      state: 'UNKNOWN',
      reason: 'UNKNOWN_INPUT',
    });
  });

  it('rend UNKNOWN quand l’état du connecteur n’a pas été sondé', () => {
    expect(resolveCapability(executeAction, ctx({ connector: 'UNKNOWN' })).state).toBe('UNKNOWN');
  });

  it('ignore un connecteur inconnu si la capacité n’en dépend pas', () => {
    const r = resolveCapability(
      readCases,
      ctx({
        connector: 'UNKNOWN',
        permission: { level: 'READ', expired: false, revoked: false },
      }),
    );
    expect(r.state).toBe('AVAILABLE');
  });
});

describe('Capacités — PARTIAL n’est pas un BLOCKED poli', () => {
  it('rend PARTIAL quand une partie utile fonctionne', () => {
    const tolerant: CapabilityRequirements = { ...executeAction, degrades_gracefully: true };
    expect(resolveCapability(tolerant, ctx({ connector: 'DISCONNECTED' }))).toEqual({
      state: 'PARTIAL',
      reason: 'CONNECTOR_DISCONNECTED',
    });
  });

  it('rend BLOCKED quand rien d’utile ne fonctionne', () => {
    // Un PARTIAL complaisant ferait cliquer dans le vide.
    expect(resolveCapability(executeAction, ctx({ connector: 'DISCONNECTED' }))).toEqual({
      state: 'BLOCKED',
      reason: 'CONNECTOR_DISCONNECTED',
    });
  });

  it('rend PARTIAL sur réseau dégradé', () => {
    expect(resolveCapability(executeAction, ctx({ network: 'DEGRADED' }))).toEqual({
      state: 'PARTIAL',
      reason: 'DEGRADED',
    });
  });
});

describe('Capacités — déterminisme', () => {
  it('rend toujours le même résultat pour le même contexte', () => {
    const a = resolveCapability(executeAction, healthy);
    const b = resolveCapability(executeAction, healthy);
    expect(a).toEqual(b);
  });

  it('ne rend jamais un état hors du vocabulaire déclaré', () => {
    const contexts: CapabilityContext[] = [
      healthy,
      ctx({ permission: null }),
      ctx({ network: 'OFFLINE' }),
      ctx({ connector: 'ERROR' }),
      ctx({ feature_enabled: false }),
      ctx({ safe_mode: { active: true, blocks_execution: true } }),
    ];
    for (const context of contexts) {
      const r = resolveCapability(executeAction, context);
      expect(['AVAILABLE', 'PARTIAL', 'BLOCKED', 'UNKNOWN']).toContain(r.state);
    }
  });
});
