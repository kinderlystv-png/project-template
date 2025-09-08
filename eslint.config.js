import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    rules: {
      // TypeScript rules - relaxed for existing codebase
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-this-alias': 'warn',

      // General code quality - relaxed warnings
      'no-console': 'warn',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-unused-vars': 'off', // Handled by TypeScript
      'no-undef': 'off', // Handled by TypeScript
      'no-empty': 'warn',
      'no-prototype-builtins': 'warn',
      'no-useless-escape': 'warn',
      'no-redeclare': 'warn',
      'no-cond-assign': 'warn',
      'no-fallthrough': 'warn',

      // Svelte specific rules
      'svelte/valid-compile': 'error',
      'svelte/no-at-debug-tags': 'warn',
      'svelte/no-unused-svelte-ignore': 'warn',
    },
  },
  {
    ignores: [
      'build/',
      '.svelte-kit/',
      'dist/',
      'node_modules/',
      'coverage/',
      'test-results/',
      'static/',
      'logs/',
      'docs/',
      'project-template/',
      'emt-v3-stable-clean/',
      'eap-analyzer/',
      'testing-integration-package/',
      'scripts/',
      '*.config.js',
      '*.config.ts',
      'vite.config.complex.ts',
      'vitest.config.*',
      'commitlint.config.*',
      'tsconfig*.json',
      '*.min.js',
      '*.bundle.js',
    ],
  },
];
