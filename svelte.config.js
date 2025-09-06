import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Preprocess для поддержки TypeScript, PostCSS и других препроцессоров
  preprocess: vitePreprocess(),

  kit: {
    // Адаптер для развертывания
    adapter: adapter(),

    // Алиасы для импортов
    alias: {
      '@': './src',
      '@components': './src/components',
      '@stores': './src/stores',
      '@utils': './src/utils',
      '@assets': './src/assets',
      '@types': './src/types',
    },
  },

  // Настройки компилятора Svelte
  compilerOptions: {
    // Включаем dev-режим для лучших сообщений об ошибках
    dev: process.env.NODE_ENV === 'development',
  },
};

export default config;
