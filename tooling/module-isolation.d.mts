/**
 * Déclarations pour `module-isolation.mjs`.
 *
 * Le script reste en JavaScript pour être exécutable par `node` sans étape de
 * compilation — la CI doit pouvoir l'appeler avant même que les paquets soient
 * construits. Ces déclarations lui rendent le typage strict côté tests.
 */

export interface ModuleIsolationViolation {
  /** Chemin du fichier fautif, relatif à la racine analysée. */
  readonly file: string;
  readonly line: number;
  /** Module qui importe. */
  readonly from: string;
  /** Module importé, ce qui est interdit. */
  readonly to: string;
  /** Spécifieur d'import tel qu'écrit dans le code. */
  readonly specifier: string;
}

export declare function listModules(root?: string): string[];

export declare function findViolations(root?: string): ModuleIsolationViolation[];
