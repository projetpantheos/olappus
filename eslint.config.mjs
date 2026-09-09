import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.expo/**', '**/coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mts,mjs}'],
    rules: {
      // Un `any` masque les frontières de données : interdit hors dérogation tracée.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // SEC-34 : rien ne doit être journalisé sans passer par la rédaction.
      // `console` reste toléré dans tooling/, interdit ailleurs (voir override).
      // SEC-34 : la journalisation passe par `toLogRecord`, jamais par `console`.
      // En erreur et non en avertissement — `eslint .` sort à 0 malgré les
      // avertissements, un contrôle qui n'échoue pas n'en est pas un.
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Function']",
          message: 'Évaluation dynamique interdite.',
        },
        {
          selector: "CallExpression[callee.name='eval']",
          message: 'Évaluation dynamique interdite.',
        },
      ],
    },
  },
  {
    // L'outillage local s'exécute sous Node et écrit délibérément
    // sur la sortie standard. Les globales sont déclarées explicitement
    // plutôt qu'en ajoutant une dépendance de plus.
    files: ['tooling/**/*.{mjs,ts}', '*.config.{mjs,ts}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: { 'no-console': 'off' },
  },
);
