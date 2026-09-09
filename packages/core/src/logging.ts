/**
 * Journalisation et rédaction — `SEC-34`.
 *
 * Condition de sortie de G6 : **aucun jeton ni corps de message brut dans les
 * journaux.** Ce module est le point de passage unique par lequel cette
 * condition est tenue. Le contourner est un défaut de sécurité, pas un
 * raccourci.
 *
 * Deux barrières, et il en faut deux :
 *
 * - par **nom de clé** — `access_token`, `body`, `email`… ;
 * - par **forme de valeur** — un JWT reste un JWT s'il est rangé sous `data`,
 *   et c'est ainsi que les jetons fuient réellement : sous un nom anodin.
 *
 * En cas de doute, on omet. Un journal amputé se répare ; un jeton divulgué
 * se révoque.
 */

export const REDACTED = '[REDACTED]';
export const TRUNCATED = '…[tronqué]';

/** Longueur au-delà de laquelle une chaîne est tronquée. */
export const MAX_STRING = 256;

/** Profondeur et largeur maximales : une structure hostile ne doit pas nous occuper. */
const MAX_DEPTH = 6;
const MAX_KEYS = 64;
const MAX_ITEMS = 32;

/**
 * Clés dont la valeur ne sort jamais. Comparaison insensible à la casse et
 * aux séparateurs : `access_token`, `accessToken` et `ACCESS-TOKEN` sont la
 * même clé.
 */
const FORBIDDEN_KEYS = [
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'authorization',
  'apikey',
  'key',
  'secret',
  'clientsecret',
  'clientid',
  'password',
  'passphrase',
  'servicerole',
  'recoverycode',
  'recoverycodes',
  'dek',
  'kek',
  'cookie',
  'setcookie',
  'body',
  'rawbody',
  'payload',
  'content',
  'attachment',
  'attachments',
  'preparedpayload',
  'email',
  'emailaddress',
  'address',
  'postaladdress',
  'phone',
  'phonenumber',
  'iban',
  'prompt',
  'completion',
  'thirdpartyidentity',
];

const normalizeKey = (key: string): string => key.toLowerCase().replace(/[^a-z0-9]/g, '');

function isForbiddenKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return FORBIDDEN_KEYS.includes(normalized);
}

/**
 * Formes de valeurs sensibles, quel que soit le nom sous lequel elles voyagent.
 * C'est la barrière qui rattrape un jeton rangé sous `data`.
 */
const FORBIDDEN_VALUES: readonly RegExp[] = [
  /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\./, // JWT
  /-----BEGIN (?:[A-Z ]+)?PRIVATE KEY-----/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // adresse email
  /\b[A-Z]{2}\d{2}[ ]?(?:[A-Za-z0-9]{4}[ ]?){2,7}[A-Za-z0-9]{1,4}\b/, // IBAN
  /\b(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}\b/, // téléphone français
  /\bBearer\s+[A-Za-z0-9._~+/-]{10,}/i,
  /\b(?:AIza[0-9A-Za-z_-]{35}|gh[pousr]_[0-9A-Za-z]{30,}|xox[abprs]-[0-9A-Za-z-]{10,})\b/,
];

function looksSensitive(value: string): boolean {
  return FORBIDDEN_VALUES.some((re) => re.test(value));
}

function redactString(value: string): string {
  if (looksSensitive(value)) return REDACTED;
  return value.length > MAX_STRING ? value.slice(0, MAX_STRING) + TRUNCATED : value;
}

/**
 * Rend une valeur journalisable.
 *
 * Ne renvoie jamais l'objet d'origine : la structure est reconstruite, ce qui
 * empêche une sérialisation implicite d'un objet porteur de getters, de
 * prototypes ou de champs non prévus.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[profondeur maximale]';

  if (value === null || value === undefined) return value;

  switch (typeof value) {
    case 'string':
      return redactString(value);
    case 'number':
    case 'boolean':
      return value;
    case 'bigint':
      return value.toString();
    // Une fonction ou un symbole dans un journal n'apporte rien et peut porter
    // une fermeture sur des données sensibles.
    case 'function':
    case 'symbol':
      return '[non journalisable]';
    default:
      break;
  }

  if (value instanceof Date) return value.toISOString();

  // Une erreur ne se sérialise pas seule : ses champs propres sont invisibles
  // à JSON.stringify, et sa pile peut contenir des valeurs.
  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }

  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ITEMS).map((item) => redact(item, depth + 1));
    if (value.length > MAX_ITEMS) items.push(`[${String(value.length - MAX_ITEMS)} de plus]`);
    return items;
  }

  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    let seen = 0;
    for (const key of Object.keys(source)) {
      if (seen >= MAX_KEYS) {
        out['…'] = '[clés supplémentaires omises]';
        break;
      }
      seen += 1;
      out[key] = isForbiddenKey(key) ? REDACTED : redact(source[key], depth + 1);
    }
    return out;
  }

  return '[non journalisable]';
}

/** Niveaux de journal technique. L'audit métier n'est pas un journal (`SEC-34`). */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogRecord {
  readonly level: LogLevel;
  readonly event: string;
  readonly correlation_id?: string;
  readonly fields?: Record<string, unknown>;
}

/**
 * Construit l'enregistrement à écrire. Il n'écrit rien lui-même : le
 * destinataire dépend de l'environnement, la rédaction n'en dépend pas.
 */
export function toLogRecord(record: LogRecord): Record<string, unknown> {
  const out: Record<string, unknown> = {
    level: record.level,
    event: redactString(record.event),
  };
  if (record.correlation_id !== undefined) out['correlation_id'] = record.correlation_id;
  if (record.fields !== undefined) out['fields'] = redact(record.fields);
  return out;
}

/**
 * Erreur structurée d'`ARC-04`.
 *
 * `safe_details` est une **liste blanche** : seules les clés explicitement
 * déclarées sûres y entrent. C'est l'inverse d'un déversement d'objet, et
 * c'est délibéré — une liste noire laisse toujours passer le champ qu'on n'a
 * pas anticipé.
 */
export interface StructuredError {
  readonly code: string;
  readonly user_message: string;
  readonly retryable: boolean;
  readonly correlation_id: string;
  readonly safe_details: Record<string, unknown>;
}

/** Clés admises dans `safe_details`. Toute autre est écartée sans exception. */
export const SAFE_DETAIL_KEYS = [
  'user_id',
  'case_id',
  'action_id',
  'command_id',
  'correlation_id',
  'module_id',
  'rule_id',
  'rule_version',
  'source_id',
  'status',
  'http_status',
  'attempt',
  'duration_ms',
  'count',
  'email_domain',
  'sender_pseudonym_id',
] as const;

export function toStructuredError(input: {
  code: string;
  userMessage: string;
  retryable: boolean;
  correlationId: string;
  details?: Record<string, unknown>;
}): StructuredError {
  const safe: Record<string, unknown> = {};
  for (const key of SAFE_DETAIL_KEYS) {
    const value = input.details?.[key];
    if (value === undefined) continue;
    // Même sur une clé de la liste blanche : une valeur de forme sensible est
    // écartée. La liste blanche porte sur l'intention, pas sur le contenu.
    const cleaned = redact(value);
    if (cleaned !== REDACTED) safe[key] = cleaned;
  }
  return {
    code: input.code,
    user_message: redactString(input.userMessage),
    retryable: input.retryable,
    correlation_id: input.correlationId,
    safe_details: safe,
  };
}
