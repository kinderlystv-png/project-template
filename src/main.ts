import './app/app.css';
import App from './App.svelte';

// Удаляем loader после загрузки приложения
document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 300);
    }, 500);
  }
});

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
