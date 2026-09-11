import type { SecureStore } from '@olappus/core';
import * as SecureStoreNative from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Coffre réel de l'appareil — `SEC-31`, ADR-0019.
 *
 * `expo-secure-store` s'adosse au **Keychain** sur iOS et au **Keystore** sur
 * Android. C'est ce que `SEC-31` exige : « toujours le stockage sécurisé
 * natif », jamais le stockage ordinaire de l'application, qui n'est pas
 * chiffré et qu'une sauvegarde peut emporter ailleurs.
 *
 * ## Le web n'a pas de coffre
 *
 * Sur navigateur, `expo-secure-store` retombe sur le stockage local, qui n'est
 * ni chiffré ni protégé par le système. Ce serait donner le nom de « coffre »
 * à une étagère.
 *
 * On refuse donc explicitement, et la conséquence est assumée : **sur le web,
 * le secret est redemandé à chaque session.** C'est moins commode, et c'est la
 * seule chose honnête à faire — la version web sert à voir et à juger le
 * produit, pas à garder des clés.
 */

export class NoDeviceVaultError extends Error {}

/** Vrai quand la plateforme offre un coffre matériel digne de ce nom. */
export function hasDeviceVault(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Coffre de l'appareil.
 *
 * Sur les plateformes sans coffre, chaque opération échoue en le disant, au
 * lieu d'écrire ailleurs et de laisser croire que c'est protégé.
 */
export const deviceVault: SecureStore = {
  async get(key) {
    assertVault();
    return SecureStoreNative.getItemAsync(key);
  },
  async set(key, value) {
    assertVault();
    await SecureStoreNative.setItemAsync(key, value, {
      // La clé ne sort pas de cet appareil et ne part pas en sauvegarde vers
      // iCloud : une clé sauvegardée ailleurs est une clé qui vit ailleurs.
      keychainAccessible: SecureStoreNative.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async remove(key) {
    assertVault();
    await SecureStoreNative.deleteItemAsync(key);
  },
};

function assertVault(): void {
  if (!hasDeviceVault()) {
    throw new NoDeviceVaultError(
      'Cette plateforme ne fournit pas de coffre sécurisé. ' +
        'Olappus ne range pas une clé dans un stockage non protégé : ' +
        'votre secret vous sera redemandé à chaque session.',
    );
  }
}
