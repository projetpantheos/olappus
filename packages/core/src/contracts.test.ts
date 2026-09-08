import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  COMMANDS,
  EVENTS,
  isSideEffecting,
  parseCommand,
  parseEvent,
  type CommandName,
} from './contracts.js';

const envelope = () => ({
  command_id: randomUUID(),
  actor_id: randomUUID(),
  device_id: randomUUID(),
  correlation_id: randomUUID(),
  created_at: '2026-09-08T10:00:00Z',
  schema_version: 1,
});

const eventEnvelopeFixture = (type: string) => ({
  event_id: randomUUID(),
  aggregate_id: randomUUID(),
  event_type: type,
  occurred_at: '2026-09-08T10:00:00Z',
  schema_version: 1,
  causation_id: randomUUID(),
  correlation_id: randomUUID(),
  actor_id: randomUUID(),
});

describe('Enveloppe — ADR-0006', () => {
  it('accepte une Command conforme', () => {
    const r = parseCommand('CreateCaseCommandV1', {
      ...envelope(),
      payload: { module_id: 'themis', type: 'deadline', confidence: 'PROBABLE' },
    });
    expect(r.ok).toBe(true);
  });

  it('exige actor_id, présent nativement dans l’enveloppe', () => {
    const { actor_id: _ignored, ...withoutActor } = envelope();
    const r = parseCommand('CreateCaseCommandV1', {
      ...withoutActor,
      payload: { module_id: 'themis', type: 'deadline', confidence: 'PROBABLE' },
    });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.issues.join(' ')).toContain('actor_id');
  });

  it('refuse un tenantId : le multi-tenant est fermé (OPEN-09)', () => {
    const r = parseCommand('CreateCaseCommandV1', {
      ...envelope(),
      tenantId: 'x',
      payload: { module_id: 'themis', type: 'deadline', confidence: 'PROBABLE' },
    });
    expect(r.ok).toBe(false);
  });

  it('exige un horodatage avec fuseau explicite', () => {
    const r = parseCommand('CreateCaseCommandV1', {
      ...envelope(),
      created_at: '2026-09-08 10:00:00',
      payload: { module_id: 'themis', type: 'deadline', confidence: 'PROBABLE' },
    });
    expect(r.ok).toBe(false);
  });

  it('exige des identifiants opaques, jamais porteurs de sens', () => {
    const r = parseCommand('CreateCaseCommandV1', {
      ...envelope(),
      actor_id: 'utilisateur@example.com',
      payload: { module_id: 'themis', type: 'deadline', confidence: 'PROBABLE' },
    });
    expect(r.ok).toBe(false);
  });
});

describe('Validation stricte — aucun champ inattendu', () => {
  it('rejette une propriété supplémentaire dans l’enveloppe', () => {
    // Une charge venue d'un client obsolète ou d'un contenu non fiable ne doit
    // pas pouvoir glisser de propriété dans le domaine.
    const r = parseCommand('CreateCaseCommandV1', {
      ...envelope(),
      is_admin: true,
      payload: { module_id: 'themis', type: 'deadline', confidence: 'PROBABLE' },
    });
    expect(r.ok).toBe(false);
  });

  it('rejette une propriété supplémentaire dans la charge utile', () => {
    const r = parseCommand('CreateCaseCommandV1', {
      ...envelope(),
      payload: {
        module_id: 'themis',
        type: 'deadline',
        confidence: 'PROBABLE',
        bypass_confirmation: true,
      },
    });
    expect(r.ok).toBe(false);
  });

  it('rejette une valeur hors du vocabulaire déclaré', () => {
    const r = parseCommand('CreateCaseCommandV1', {
      ...envelope(),
      payload: { module_id: 'themis', type: 'deadline', confidence: 'TRÈS_SÛR' },
    });
    expect(r.ok).toBe(false);
  });
});

describe('Versionnement', () => {
  it('rejette une version de schéma qui ne correspond pas au contrat', () => {
    const r = parseCommand('CreateCaseCommandV1', {
      ...envelope(),
      schema_version: 2,
      payload: { module_id: 'themis', type: 'deadline', confidence: 'PROBABLE' },
    });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.issues.join(' ')).toContain('schema_version');
  });

  it('chaque contrat déclare explicitement sa version', () => {
    for (const [name, definition] of Object.entries(COMMANDS)) {
      expect(definition.version, name).toBeGreaterThanOrEqual(1);
      expect(name.endsWith(`V${String(definition.version)}`), name).toBe(true);
    }
  });
});

describe('Actions externes — invariant de contenu non fiable', () => {
  it('le destinataire est une référence canonique, jamais une adresse libre', () => {
    // Un destinataire extrait d'un email hostile ne peut pas devenir paramètre
    // d'une action externe : le contrat n'accepte qu'une référence opaque.
    const r = parseCommand('PrepareActionCommandV1', {
      ...envelope(),
      payload: {
        case_id: randomUUID(),
        action_type: 'claim',
        recipient_ref: 'remboursement@attaquant.example',
        scope: {},
      },
    });
    expect(r.ok).toBe(false);
  });

  it('accepte une référence canonique ou l’absence de destinataire', () => {
    for (const recipient of [randomUUID(), null]) {
      const r = parseCommand('PrepareActionCommandV1', {
        ...envelope(),
        payload: {
          case_id: randomUUID(),
          action_type: 'claim',
          recipient_ref: recipient,
          scope: {},
        },
      });
      expect(r.ok).toBe(true);
    }
  });

  it('une confirmation ne peut pas être négative', () => {
    // ConfirmAction n'existe que pour confirmer : un `false` serait une
    // annulation déguisée, avec un autre effet et un autre audit.
    const r = parseCommand('ConfirmActionCommandV1', {
      ...envelope(),
      payload: { action_id: randomUUID(), confirmed: false },
    });
    expect(r.ok).toBe(false);
  });

  it('la déconnexion exige un choix explicite sur les données dérivées', () => {
    // DISCONNECT ≠ DELETE : le choix ne se déduit pas.
    const r = parseCommand('DisconnectConnectorCommandV1', {
      ...envelope(),
      payload: { connector_id: 'hermes' },
    });
    expect(r.ok).toBe(false);
  });
});

describe('Events', () => {
  it('valide un Event conforme', () => {
    const r = parseEvent('CaseCreated.v1', {
      ...eventEnvelopeFixture('CaseCreated.v1'),
      payload: {
        case_id: randomUUID(),
        module_id: 'themis',
        type: 'deadline',
        status: 'DETECTED',
        confidence: 'PROBABLE',
      },
    });
    expect(r.ok).toBe(true);
  });

  it('exige causation_id : sans lui, la chaîne causale est perdue', () => {
    const { causation_id: _ignored, ...withoutCausation } = eventEnvelopeFixture('CaseCreated.v1');
    const r = parseEvent('CaseCreated.v1', {
      ...withoutCausation,
      payload: {
        case_id: randomUUID(),
        module_id: 'themis',
        type: 'deadline',
        status: 'DETECTED',
        confidence: 'PROBABLE',
      },
    });
    expect(r.ok).toBe(false);
  });

  it('refuse un event_type incohérent avec le contrat demandé', () => {
    const r = parseEvent('CaseCreated.v1', {
      ...eventEnvelopeFixture('ActionPrepared.v1'),
      payload: {
        case_id: randomUUID(),
        module_id: 'themis',
        type: 'deadline',
        status: 'DETECTED',
        confidence: 'PROBABLE',
      },
    });
    expect(r.ok).toBe(false);
  });

  it('tout type d’Event est versionné dans son nom', () => {
    for (const type of Object.keys(EVENTS)) {
      expect(type, type).toMatch(/\.v\d+$/);
    }
  });
});

describe('Idempotence — marquage des effets de bord', () => {
  it('toutes les Commands déclarées ont un effet de bord', () => {
    // ARC-17 : les Queries sont pures et ne passent pas par ce registre.
    // Si une Command sans effet apparaît un jour, ce test doit être révisé
    // consciemment, pas contourné.
    for (const name of Object.keys(COMMANDS) as CommandName[]) {
      expect(isSideEffecting(name), name).toBe(true);
    }
  });
});
