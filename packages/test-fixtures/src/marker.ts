/**
 * Marqueur synthétique — isolé dans son propre module.
 *
 * Le placer dans `index.ts` créait un cycle : `index` ré-exporte `scenarios` et
 * `adversarial`, qui importaient le marqueur depuis `index`. Au chargement, la
 * constante n'était pas encore initialisée et le bundle échouait.
 */

/** Porté par toute fixture, pour qu'aucune ne soit prise pour une donnée réelle. */
export const SYNTHETIC_MARKER = 'SYNTHETIC' as const;

export type Synthetic<T> = T & { readonly _source: typeof SYNTHETIC_MARKER };
