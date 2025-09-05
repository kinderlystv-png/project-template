module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: ['eslint:recommended'],
  rules: {
    // Разрешаем console.log в скриптах
    'no-console': 'off',
    // Разрешаем require в CommonJS модулях
    '@typescript-eslint/no-var-requires': 'off',
    // Отключаем строгие правила для utility скриптов
    'no-process-exit': 'off',
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'script',
  },
};
