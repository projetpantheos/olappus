import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `dist/` contient la version compilée des tests : sans cette exclusion,
    // chaque test serait exécuté deux fois et un test supprimé de `src`
    // continuerait de passer depuis `dist`.
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.expo/**'],
    include: ['**/src/**/*.{test,spec}.ts'],
  },
});
