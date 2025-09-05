import { writable } from 'svelte/store';

// Глобальное состояние приложения
export const appState = writable({
  isLoading: false,
  theme: 'light' as 'light' | 'dark',
});

// Экспорт типов для TypeScript
export interface AppState {
  isLoading: boolean;
  theme: 'light' | 'dark';
}
