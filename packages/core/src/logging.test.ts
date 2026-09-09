/**
 * Journalisation et rédaction — `SEC-34`, preuves attendues.
 *
 * Condition de sortie de G6 : aucun jeton ni corps de message brut dans les
 * journaux. Ces tests l'établissent **avant** qu'un connecteur existe : après,
 * il serait trop tard — la première fuite aurait déjà eu lieu, et un journal
 * fuité ne se rappelle pas.
 *
 * Toutes les valeurs sont synthétiques.
 */

import { describe, expect, it } from 'vitest';

import {
  MAX_STRING,
  REDACTED,
  SAFE_DETAIL_KEYS,
  redact,
  toLogRecord,
  toStructuredError,
} from './logging';

/** Sérialise comme le ferait un collecteur de journaux. */
const rendu = (value: unknown): string => JSON.stringify(redact(value));

const JETON = `eyJhbGciOiJIUzI1NiJ9.${'eyJzdWIiOiJzeW50aGV0aXF1ZSJ9'}.c2lnbmF0dXJlLXN5bnRoZXRpcXVl`;

describe('Rédaction — les valeurs interdites ne sortent pas', () => {
  it('supprime un jeton rangé sous un nom de clé explicite', () => {
    const sortie = rendu({ access_token: JETON, refresh_token: JETON });
    expect(sortie).not.toContain('eyJ');
    expect(sortie).toContain(REDACTED);
  });

  it('supprime un jeton rangé sous un nom anodin', () => {
    // La barrière qui compte vraiment. Les jetons ne fuient pas sous
    // `access_token` — ils fuient sous `data`, `value` ou `result`.
    expect(rendu({ data: JETON })).not.toContain('eyJ');
    expect(rendu({ resultat: { valeur: JETON } })).not.toContain('eyJ');
    expect(rendu([JETON])).not.toContain('eyJ');
  });

  it('supprime un en-tête Authorization', () => {
    expect(rendu({ headers: { note: 'Bearer abcdefghijklmnopqrst' } })).not.toContain('abcdef');
  });

  it('supprime une adresse email, même hors d’un champ nommé', () => {
    // ADR-0012 : l'email est AI_FORBIDDEN, et il n'a rien à faire en clair
    // dans un journal, quel que soit le champ qui le porte.
    expect(rendu({ message: 'Envoyé à client@exemple.test' })).not.toContain('@exemple.test');
    expect(rendu({ email: 'client@exemple.test' })).toContain(REDACTED);
  });

  it('supprime un IBAN et un numéro de téléphone', () => {
    expect(rendu({ note: 'FR7630006000011234567890189' })).not.toContain('FR7630006000');
    expect(rendu({ note: 'Rappeler au 06 12 34 56 78' })).not.toContain('06 12 34 56 78');
  });

  it('supprime une clé privée', () => {
    const pem = `${'-'.repeat(5)}BEGIN PRIVATE KEY${'-'.repeat(5)}`;
    expect(rendu({ note: pem })).not.toContain('BEGIN PRIVATE KEY');
  });

  it('supprime le corps d’un message et ses pièces jointes', () => {
    const sortie = rendu({
      body: 'Bonjour, je conteste le prélèvement du 3 mars.',
      attachments: ['facture.pdf'],
    });
    expect(sortie).not.toContain('conteste');
    expect(sortie).not.toContain('facture.pdf');
  });

  it('supprime la charge préparée d’une action', () => {
    // Champ L3 au Data Registry : il ne sort ni de la base en clair, ni d'un
    // journal.
    expect(rendu({ prepared_payload: { destinataire: 'service@marchand.test' } })).toContain(
      REDACTED,
    );
  });

  it('ne se laisse pas contourner par la casse ni par le séparateur', () => {
    for (const clef of ['accessToken', 'ACCESS-TOKEN', 'Access_Token', 'access token']) {
      expect(rendu({ [clef]: 'valeur-sensible-quelconque' }), clef).toContain(REDACTED);
    }
  });
});

describe('Rédaction — ce qui reste lisible', () => {
  it('conserve les identifiants opaques et les mesures', () => {
    const sortie = redact({
      user_id: '11111111-2222-4333-8444-555555555555',
      case_id: 'case-42',
      duration_ms: 128,
      retryable: true,
      module_id: 'themis',
    }) as Record<string, unknown>;
    expect(sortie['user_id']).toBe('11111111-2222-4333-8444-555555555555');
    expect(sortie['duration_ms']).toBe(128);
    expect(sortie['retryable']).toBe(true);
    expect(sortie['module_id']).toBe('themis');
  });

  it('conserve le domaine d’un email, qui est une donnée dérivée', () => {
    // ADR-0012 autorise `email_domain` ; c'est ce qui permet de diagnostiquer
    // sans identifier.
    expect(redact({ email_domain: 'exemple.test' })).toEqual({ email_domain: 'exemple.test' });
  });
});

describe('Rédaction — elle ne se laisse pas épuiser', () => {
  it('tronque une chaîne trop longue', () => {
    const sortie = redact({ note: 'a'.repeat(MAX_STRING + 500) }) as Record<string, string>;
    expect(sortie['note']?.length).toBeLessThan(MAX_STRING + 30);
    expect(sortie['note']).toContain('tronqué');
  });

  it('borne la profondeur d’un objet imbriqué', () => {
    let objet: Record<string, unknown> = { fond: 'atteint' };
    for (let i = 0; i < 50; i++) objet = { niveau: objet };
    expect(() => rendu(objet)).not.toThrow();
    expect(rendu(objet)).toContain('profondeur maximale');
  });

  it('borne le nombre d’éléments d’un tableau', () => {
    const sortie = redact(Array.from({ length: 200 }, (_, i) => i)) as unknown[];
    expect(sortie.length).toBeLessThan(40);
  });

  it('survit à une structure cyclique', () => {
    // Un objet cyclique fait exploser `JSON.stringify`. Un journal qui plante
    // à l'écriture est un journal absent au moment où il servirait.
    const objet: Record<string, unknown> = { nom: 'racine' };
    objet['soi'] = objet;
    expect(() => rendu(objet)).not.toThrow();
  });

  it('ne journalise ni fonction ni symbole', () => {
    const sortie = rendu({ rappel: () => JETON, marque: Symbol('x') });
    expect(sortie).not.toContain('eyJ');
    expect(sortie).toContain('non journalisable');
  });
});

describe('Erreur structurée — liste blanche, jamais déversement', () => {
  it('n’expose que les clés déclarées sûres', () => {
    const erreur = toStructuredError({
      code: 'SOURCE_UNAVAILABLE',
      userMessage: 'La source officielle est momentanément indisponible.',
      retryable: true,
      correlationId: 'corr-1',
      details: {
        source_id: 'legifrance',
        http_status: 503,
        access_token: JETON,
        body: 'contenu brut',
        email: 'client@exemple.test',
      },
    });

    expect(Object.keys(erreur.safe_details).sort()).toEqual(['http_status', 'source_id']);
    expect(JSON.stringify(erreur)).not.toContain('eyJ');
    expect(JSON.stringify(erreur)).not.toContain('contenu brut');
    expect(JSON.stringify(erreur)).not.toContain('@exemple.test');
  });

  it('écarte une valeur sensible même sous une clé autorisée', () => {
    // La liste blanche porte sur l'intention du champ, pas sur son contenu.
    // Quelqu'un finira par ranger un jeton dans `status`.
    const erreur = toStructuredError({
      code: 'X',
      userMessage: 'x',
      retryable: false,
      correlationId: 'corr-2',
      details: { status: JETON },
    });
    expect(erreur.safe_details['status']).toBeUndefined();
  });

  it('nettoie le message destiné à l’utilisateur', () => {
    const erreur = toStructuredError({
      code: 'X',
      userMessage: 'Échec de l’envoi à client@exemple.test',
      retryable: false,
      correlationId: 'corr-3',
    });
    expect(erreur.user_message).not.toContain('@exemple.test');
  });

  it('déclare une liste blanche réellement restreinte', () => {
    // Garde contre l'élargissement silencieux : si cette liste devient longue,
    // elle cesse d'être une liste blanche.
    expect(SAFE_DETAIL_KEYS.length).toBeLessThanOrEqual(20);
  });
});

describe('Enregistrement de journal', () => {
  it('rédige les champs et conserve la corrélation', () => {
    const record = toLogRecord({
      level: 'error',
      event: 'connector.exchange_failed',
      correlation_id: 'corr-4',
      fields: { source_id: 'legifrance', access_token: JETON, attempt: 2 },
    });
    expect(record['correlation_id']).toBe('corr-4');
    expect(JSON.stringify(record)).not.toContain('eyJ');
    expect((record['fields'] as Record<string, unknown>)['attempt']).toBe(2);
  });

  it('ne laisse pas un jeton passer par le nom de l’événement', () => {
    const record = toLogRecord({ level: 'info', event: `oauth ${JETON}` });
    expect(JSON.stringify(record)).not.toContain('eyJ');
  });
});
