/**
 * PostCSS Configuration
 * Оптимизированная конфигурация для обработки CSS
 */

export default {
  plugins: {
    // Импорт CSS файлов
    'postcss-import': {},

    // Tailwind CSS
    tailwindcss: {},

    // Autoprefixer для кроссбраузерности
    autoprefixer: {
      overrideBrowserslist: ['> 1%', 'last 2 versions', 'not dead', 'not ie 11', 'not op_mini all'],
      cascade: false,
    },

    // Минификация CSS в продакшене
    ...(process.env.NODE_ENV === 'production'
      ? {
          cssnano: {
            preset: [
              'default',
              {
                // Настройки оптимизации
                discardComments: {
                  removeAll: true,
                },
                normalizeWhitespace: true,
                mergeLonghand: true,
                mergeRules: true,
                minifyFontValues: true,
                minifyParams: true,
                minifySelectors: true,
                reduceIdents: false, // Сохраняем CSS переменные
                svgo: {
                  plugins: [
                    { name: 'removeViewBox', active: false },
                    { name: 'removeDimensions', active: false },
                  ],
                },
              },
            ],
          },
        }
      : {}),
  },
};
