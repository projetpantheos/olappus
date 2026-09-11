import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `dist/` contient la version compilée des tests : sans cette exclusion,
    // chaque test serait exécuté deux fois et un test supprimé de `src`
    // continuerait de passer depuis `dist`.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      // L'application mobile est testée par jest-expo, qui fournit React
      // Native et ses mocks. Vitest ne ramassait ses tests que par accident
      // d'extension — les autres sont en .tsx — et échouait sur Flow.
      'apps/mobile/**',
    ],
    include: ['**/src/**/*.{test,spec}.ts'],
  },
});
