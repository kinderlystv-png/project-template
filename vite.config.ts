import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  return {
    plugins: [
      svelte({
        compilerOptions: {
          dev: isDevelopment,
        },
        onwarn: (warning, handler) => {
          // Игнорируем предупреждения a11y в dev режиме
          if (isDevelopment && warning.code.startsWith('a11y-')) return;
          handler?.(warning);
        },
      }),
    ],

    // Настройки разработки
    server: {
      port: parseInt(env.VITE_PORT) || 3000,
      host: env.VITE_HOST || true,
      open: env.VITE_OPEN !== 'false',
      cors: true,
      hmr: {
        overlay: true,
        clientPort: parseInt(env.VITE_HMR_PORT) || undefined,
      },
      // Прокси для API запросов
      proxy: env.VITE_API_URL
        ? {
            '/api': {
              target: env.VITE_API_URL,
              changeOrigin: true,
              secure: true,
            },
          }
        : undefined,
    },

    // Настройки предварительного просмотра
    preview: {
      port: parseInt(env.VITE_PREVIEW_PORT) || 4173,
      host: env.VITE_PREVIEW_HOST || true,
      open: env.VITE_PREVIEW_OPEN !== 'false',
    },

    // Настройки сборки
    build: {
      target: isProduction ? 'es2020' : 'esnext',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isDevelopment || env.VITE_SOURCEMAP === 'true',
      minify: isProduction ? 'terser' : false,

      // CSS код splitting
      cssCodeSplit: true,

      // Производительность сборки
      reportCompressedSize: isProduction,
      chunkSizeWarningLimit: 1000,

      // Terser настройки для производительности
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: env.VITE_DROP_CONSOLE === 'true',
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.debug'],
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
            },
          }
        : undefined,

      rollupOptions: {
        output: {
          // Оптимизированное разделение чанков
          manualChunks: isProduction
            ? {
                // Основные библиотеки
                'vendor-svelte': ['svelte', '@sveltejs/kit'],

                // 3D библиотеки
                'vendor-three': ['three'],

                // Анимации
                'vendor-animations': ['gsap', 'lottie-web', 'framer-motion'],

                // Утилиты
                'vendor-utils': ['lodash-es', 'date-fns'],

                // UI компоненты (если используются)
                'vendor-ui': ['@headlessui/svelte'],

                // Наши системы
                'lib-cache': ['src/lib/cache'],
                'lib-api': ['src/lib/api'],
                'lib-monitoring': ['src/lib/monitoring'],
                'lib-utils': ['src/lib/utils'],
              }
            : undefined,

          // Оптимизация имен файлов
          chunkFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          entryFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          assetFileNames: isProduction ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]',
        },

        // Внешние зависимости (для библиотечного режима)
        external:
          command === 'build' && mode === 'library'
            ? ['svelte', 'svelte/store', '@sveltejs/kit']
            : [],
      },
    },

    // Алиасы для удобного импорта
    resolve: {
      alias: {
        $lib: path.resolve('./src/lib'),
        $components: path.resolve('./src/components'),
        $stores: path.resolve('./src/stores'),
        $assets: path.resolve('./src/assets'),
        $utils: path.resolve('./src/utils'),
        $data: path.resolve('./src/data'),
        $config: path.resolve('./src/config'),
        $types: path.resolve('./src/types'),
        '@': path.resolve('./src'),
      },
    },

    // Настройки CSS
    css: {
      devSourcemap: isDevelopment,
      preprocessorOptions: {
        scss: {
          additionalData: '@import "src/styles/variables.scss";',
          // Включаем legacy API для совместимости
          api: 'modern-compiler',
        },
      },
      // PostCSS настройки
      postcss: {
        plugins: isProduction
          ? [
              // Автопрефиксы
              require('autoprefixer')({
                overrideBrowserslist: ['> 1%', 'last 2 versions', 'not dead'],
              }),
              // Минификация CSS
              require('cssnano')({
                preset: 'default',
              }),
            ]
          : [],
      },
    },

    // Оптимизация зависимостей
    optimizeDeps: {
      include: ['three', 'gsap', 'lottie-web', 'lodash-es', 'date-fns'],
      exclude: ['@sveltejs/kit'],
      // Принудительная предварительная обработка
      force: env.VITE_FORCE_OPTIMIZE === 'true',
    },

    // Переменные окружения
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV__: isDevelopment,
      __PROD__: isProduction,
    },

    // Worker настройки
    worker: {
      format: 'es',
      plugins: () => [
        svelte({
          compilerOptions: {
            dev: false,
          },
        }),
      ],
    },

    // Экспериментальные функции
    experimental: {
      renderBuiltUrl: (filename, { hostType }) => {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      },
    },

    // Настройки логирования
    logLevel:
      (env.VITE_LOG_LEVEL as 'info' | 'warn' | 'error' | 'silent') ||
      (isDevelopment ? 'info' : 'warn'),

    // Очистка консоли при рестарте dev сервера
    clearScreen: env.VITE_CLEAR_SCREEN !== 'false',

    // Base URL для деплоя
    base: env.VITE_BASE_URL || '/',
  };
});
