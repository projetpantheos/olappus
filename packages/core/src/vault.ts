/**
 * Coffre d'appareil — `SEC-31`, `SEC-35`.
 *
 * `SEC-31` est catégorique sur l'emplacement : côté appareil, les secrets de
 * session et le matériel de clé vont **« toujours dans le stockage sécurisé
 * natif (Keychain / Keystore) »**, jamais dans le stockage ordinaire de
 * l'application.
 *
 * Ce module ne stocke rien lui-même : il porte la **politique**, et le magasin
 * est injecté. C'est ce qui permet de la mettre à l'épreuve sans appareil, et
 * d'en changer sans la réécrire.
 *
 * ## Ce que le coffre contient, et ce qu'il ne contiendra jamais
 *
 * Il contient la **clé de données déverrouillée**, pour que l'utilisateur ne
 * ressaisisse pas quarante caractères à chaque ouverture.
 *
 * Il ne contient **jamais le secret de récupération**. La nuance est tout :
 * la clé déverrouillée est un secret de session, révocable, remplaçable et
 * limité à cet appareil. Le secret de récupération, lui, est la seule chose au
 * monde qui ouvre les données — il appartient à l'utilisateur, hors ligne, et
 * un appareil volé ne doit pas le livrer.
 */

export class VaultError extends Error {}

/**
 * Magasin sécurisé de la plateforme. Volontairement minuscule : tout ce que
 * `expo-secure-store` — ou n'importe quel Keychain — sait faire.
 */
export interface SecureStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/** Préfixe unique : un coffre partagé ne doit pas mélanger deux utilisateurs. */
const PREFIX = 'olappus.v1';

/**
 * Clés admises dans le coffre. **Liste blanche** : y ranger autre chose exige
 * de modifier ce fichier, donc d'y penser.
 */
export const VAULT_KEYS = {
  /** Clé de données déverrouillée, encodée. Secret de session. */
  dataKey: (userId: string) => `${PREFIX}.${userId}.dek`,
  /** Version de la clé, pour savoir quoi déchiffrer pendant une rotation. */
  dataKeyVersion: (userId: string) => `${PREFIX}.${userId}.kv`,
  /** Horodatage du déverrouillage, pour appliquer l'expiration de session. */
  unlockedAt: (userId: string) => `${PREFIX}.${userId}.unlocked_at`,
} as const;

/**
 * Motifs qui n'ont jamais rien à faire dans une clé de coffre.
 * Le coffre est sûr ; le **nom** d'une entrée ne l'est pas toujours autant, et
 * il se retrouve dans des outils de diagnostic.
 */
const FORBIDDEN_IN_KEY = /(recovery|secret|password|passphrase|mnemonic|seed)/i;

function assertKeyAllowed(key: string): void {
  if (!key.startsWith(`${PREFIX}.`)) {
    throw new VaultError(`Clé de coffre hors périmètre : ${key}`);
  }
  if (FORBIDDEN_IN_KEY.test(key)) {
    // Garde contre la dérive : le jour où quelqu'un voudra « juste mémoriser
    // le secret pour la prochaine fois », il butera ici.
    throw new VaultError(
      `Le coffre d'appareil ne conserve pas de secret de récupération (${key}). ` +
        'Il appartient à l’utilisateur, hors ligne.',
    );
  }
}

/**
 * Durée après laquelle une session déverrouillée expire.
 *
 * `SEC-35` gouverne le cycle de vie des sessions d'appareil. Douze heures :
 * assez pour une journée d'usage sans ressaisie, assez court pour qu'un
 * appareil oublié quelque part ne reste pas déverrouillé indéfiniment.
 */
export const UNLOCK_TTL_MS = 12 * 60 * 60 * 1000;

export interface UnlockedKey {
  readonly version: number;
  readonly key: Uint8Array;
}

function encode(key: Uint8Array): string {
  let binary = '';
  for (const byte of key) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decode(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/**
 * Dépose la clé déverrouillée dans le coffre de l'appareil.
 *
 * Appelée une fois, après que l'utilisateur a saisi son secret. Les ouvertures
 * suivantes lisent le coffre et n'ont plus rien à dériver — c'est ce qui rend
 * le coût de la dérivation supportable.
 */
export async function storeUnlockedKey(
  store: SecureStore,
  userId: string,
  unlocked: UnlockedKey,
  now: number,
): Promise<void> {
  if (unlocked.key.length !== 32) {
    throw new VaultError(`Clé de ${String(unlocked.key.length)} octets ; 32 attendus.`);
  }
  const dataKey = VAULT_KEYS.dataKey(userId);
  assertKeyAllowed(dataKey);

  await store.set(dataKey, encode(unlocked.key));
  await store.set(VAULT_KEYS.dataKeyVersion(userId), String(unlocked.version));
  await store.set(VAULT_KEYS.unlockedAt(userId), String(now));
}

/**
 * Rend la clé déverrouillée, ou `null` si la session a expiré.
 *
 * Une session expirée est **purgée** au passage, pas seulement refusée : une
 * clé qu'on refuse d'utiliser mais qu'on laisse sur l'appareil reste une clé
 * sur l'appareil.
 */
export async function readUnlockedKey(
  store: SecureStore,
  userId: string,
  now: number,
): Promise<UnlockedKey | null> {
  const raw = await store.get(VAULT_KEYS.dataKey(userId));
  const version = await store.get(VAULT_KEYS.dataKeyVersion(userId));
  const unlockedAt = await store.get(VAULT_KEYS.unlockedAt(userId));

  if (raw === null || version === null || unlockedAt === null) {
    // Un état partiel n'est pas un état exploitable. On nettoie plutôt que de
    // deviner ce qui manque.
    await lock(store, userId);
    return null;
  }

  const since = Number(unlockedAt);
  if (!Number.isFinite(since) || now - since > UNLOCK_TTL_MS) {
    await lock(store, userId);
    return null;
  }

  const key = decode(raw);
  if (key.length !== 32) {
    await lock(store, userId);
    return null;
  }
  return { version: Number(version), key };
}

/**
 * Verrouille : la clé quitte l'appareil.
 *
 * Appelée à l'expiration, à la déconnexion, et à la demande de l'utilisateur.
 * Après cela, seules la saisie du secret de récupération rouvre les données —
 * y compris pour nous.
 */
export async function lock(store: SecureStore, userId: string): Promise<void> {
  await store.remove(VAULT_KEYS.dataKey(userId));
  await store.remove(VAULT_KEYS.dataKeyVersion(userId));
  await store.remove(VAULT_KEYS.unlockedAt(userId));
}

/** Temps restant avant expiration, pour le dire à l'utilisateur plutôt qu'à personne. */
export async function remainingUnlockMs(
  store: SecureStore,
  userId: string,
  now: number,
): Promise<number> {
  const unlockedAt = await store.get(VAULT_KEYS.unlockedAt(userId));
  if (unlockedAt === null) return 0;
  const since = Number(unlockedAt);
  if (!Number.isFinite(since)) return 0;
  return Math.max(0, UNLOCK_TTL_MS - (now - since));
}
