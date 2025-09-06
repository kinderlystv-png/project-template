module.exports = {
  root: true,
  env: {
    browser: true,
    es2017: true,
    node: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      extends: ['eslint:recommended'],
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-unused-vars': 'off',
        'no-undef': 'off',
      },
    },
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
      extends: ['eslint:recommended', 'plugin:svelte/recommended'],
      plugins: ['@typescript-eslint', 'svelte'],
      rules: {
        'svelte/no-at-html-tags': 'warn',
        'svelte/no-unused-svelte-ignore': 'error',
        'svelte/prefer-class-directive': 'error',
        'svelte/prefer-style-directive': 'error',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
      env: {
        jest: true,
        es6: true,
        node: true,
      },
      globals: {
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
      rules: {
        // Более мягкие правила для тестов
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        'no-unused-vars': 'off',
        'no-undef': 'off',
        'prefer-const': 'warn',
        'no-console': 'off',
        'no-debugger': 'off',
        // Разрешаем пустые функции в тестах (моки)
        '@typescript-eslint/no-empty-function': 'off',
        // Разрешаем любые типы в тестах
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        // Разрешаем require в тестах
        '@typescript-eslint/no-var-requires': 'off',
        // Более мягкие правила для именования
        '@typescript-eslint/naming-convention': 'off',
      },
    },
    {
      files: ['vite.config.ts', '*.config.ts', '*.config.js'],
      env: {
        node: true,
      },
    },
  ],
  rules: {
    // Общие правила (более мягкие)
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'prefer-const': 'warn',
    'no-var': 'warn',
    'no-unused-vars': 'warn',
    // Более мягкие правила для разработки
    'no-empty': 'warn',
    'no-constant-condition': 'warn',
    'no-unreachable': 'warn',
  },
  ignorePatterns: ['dist/', 'build/', 'node_modules/', '*.min.js', '.svelte-kit/'],
};
