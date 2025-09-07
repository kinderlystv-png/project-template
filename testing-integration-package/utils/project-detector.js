/* eslint-disable no-console */
/**
 * 🎯 УНИВЕРСАЛЬНЫЙ ДЕТЕКТОР ПРОЕКТОВ
 * Автоматически определяет фреймворк и создает конфигурацию тестирования
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Определяет тип проекта на основе package.json и структуры файлов
 */
export function detectProjectType(projectPath = process.cwd()) {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json не найден. Убедитесь, что находитесь в корне проекта.');
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  // Определение фреймворка
  if (dependencies.next || dependencies.react) {
    return dependencies.next ? 'nextjs' : 'react';
  }

  if (dependencies['@sveltejs/kit'] || dependencies.svelte) {
    return dependencies['@sveltejs/kit'] ? 'sveltekit' : 'svelte';
  }

  if (dependencies.nuxt || dependencies.vue) {
    return dependencies.nuxt ? 'nuxt' : 'vue';
  }

  if (dependencies['@angular/core']) {
    return 'angular';
  }

  return 'vanilla';
}

/**
 * Получает конфигурацию для конкретного фреймворка
 */
export function getFrameworkConfig(framework) {
  const configs = {
    react: {
      dependencies: [
        'vitest',
        '@testing-library/jest-dom',
        '@testing-library/react',
        '@testing-library/user-event',
        '@vitejs/plugin-react',
        'jsdom',
      ],
      vitestConfig: `import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});`,
      testWrapper: `import { render } from '@testing-library/react';

export function renderWithProviders(component, options = {}) {
  return render(component, options);
}`,
    },

    nextjs: {
      dependencies: [
        'vitest',
        '@testing-library/jest-dom',
        '@testing-library/react',
        '@testing-library/user-event',
        '@vitejs/plugin-react',
        'jsdom',
      ],
      vitestConfig: `import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './')
    }
  }
});`,
      testWrapper: `import { render } from '@testing-library/react';

// Мок для Next.js Router
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/'
};

export function renderWithProviders(component, options = {}) {
  return render(component, options);
}`,
    },

    vue: {
      dependencies: [
        'vitest',
        '@testing-library/jest-dom',
        '@testing-library/vue',
        '@testing-library/user-event',
        '@vitejs/plugin-vue',
        'jsdom',
      ],
      vitestConfig: `import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  }
});`,
      testWrapper: `import { render } from '@testing-library/vue';

export function renderWithProviders(component, options = {}) {
  return render(component, {
    global: {
      plugins: []
    },
    ...options
  });
}`,
    },

    sveltekit: {
      dependencies: [
        'vitest',
        '@testing-library/jest-dom',
        '@testing-library/svelte',
        '@testing-library/user-event',
        'jsdom',
      ],
      vitestConfig: `import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    alias: {
      '$lib': './src/lib',
      '$app': '@sveltejs/kit/app'
    }
  }
});`,
      testWrapper: `import { render } from '@testing-library/svelte';

export function renderWithProviders(component, options = {}) {
  return render(component, options);
}`,
    },
  };

  return configs[framework] || configs.react;
}

/**
 * Создает необходимые директории
 */
export function createDirectories(projectPath = process.cwd()) {
  const directories = [
    'tests',
    'tests/utils',
    'tests/fixtures',
    'tests/mocks',
    'tests/components',
    'src/constants',
  ];

  directories.forEach(dir => {
    const fullPath = path.join(projectPath, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Создана директория: ${dir}`);
    }
  });
}

/**
 * Создает файл setup.ts
 */
export function createSetupFile(projectPath = process.cwd()) {
  const setupContent = `import '@testing-library/jest-dom';
import { afterEach, beforeAll, vi } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();
});

beforeAll(() => {
  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));
  
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }))
  });
});`;

  const setupPath = path.join(projectPath, 'tests', 'setup.ts');
  fs.writeFileSync(setupPath, setupContent);
  console.log('✅ Создан файл setup.ts');
}

/**
 * Создает файл с константами тест-идентификаторов
 */
export function createTestIds(projectPath = process.cwd()) {
  const testIdsContent = `// Константы для test-id атрибутов
export const TEST_IDS = {
  // Базовые элементы
  FORM_SUBMIT: 'form-submit',
  FORM_CANCEL: 'form-cancel',
  ERROR_MESSAGE: 'error-message',
  SUCCESS_MESSAGE: 'success-message',
  LOADING_SPINNER: 'loading-spinner',
  
  // Кнопки
  BUTTON_PRIMARY: 'button-primary',
  BUTTON_SECONDARY: 'button-secondary',
  
  // Формы
  FIELD_EMAIL: 'field-email',
  FIELD_PASSWORD: 'field-password',
  FIELD_NAME: 'field-name',
  
  // Навигация
  NAV_HOME: 'nav-home',
  NAV_PROFILE: 'nav-profile',
  NAV_LOGOUT: 'nav-logout'
};`;

  const constantsDir = path.join(projectPath, 'src', 'constants');
  if (!fs.existsSync(constantsDir)) {
    fs.mkdirSync(constantsDir, { recursive: true });
  }

  const testIdsPath = path.join(constantsDir, 'test-ids.js');
  fs.writeFileSync(testIdsPath, testIdsContent);
  console.log('✅ Создан файл test-ids.js');
}

/**
 * Создает фабрики данных
 */
export function createFactories(projectPath = process.cwd()) {
  const factoriesContent = `// Фабрики для создания тестовых данных
export const dataFactory = {
  user: (overrides = {}) => ({
    id: crypto.randomUUID(),
    email: \`test-\${Date.now()}@example.com\`,
    name: 'Test User',
    role: 'user',
    createdAt: new Date().toISOString(),
    ...overrides
  }),
  
  event: (overrides = {}) => ({
    id: crypto.randomUUID(),
    title: 'Test Event',
    description: 'Test event description',
    date: new Date().toISOString(),
    status: 'draft',
    ...overrides
  }),
  
  client: (overrides = {}) => ({
    id: crypto.randomUUID(),
    name: 'Test Client',
    email: \`client-\${Date.now()}@example.com\`,
    phone: '+1234567890',
    ...overrides
  })
};`;

  const factoriesPath = path.join(projectPath, 'tests', 'fixtures', 'factories.js');
  fs.writeFileSync(factoriesPath, factoriesContent);
  console.log('✅ Создан файл factories.js');
}

/**
 * Обновляет package.json со скриптами тестирования
 */
export function updatePackageJsonScripts(projectPath = process.cwd()) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const testScripts = {
    test: 'vitest',
    'test:ui': 'vitest --ui',
    'test:coverage': 'vitest run --coverage',
    'test:watch': 'vitest watch',
    'test:run': 'vitest run',
  };

  packageJson.scripts = { ...packageJson.scripts, ...testScripts };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Обновлен package.json со скриптами тестирования');
}

/**
 * Создает пример теста
 */
export function createExampleTest(projectPath = process.cwd(), framework = 'react') {
  const examples = {
    react: `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Простой пример компонента для демонстрации
function TestButton({ onClick, children }) {
  return (
    <button onClick={onClick} data-testid="test-button">
      {children}
    </button>
  );
}

describe('Example Test', () => {
  it('should render and handle click', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<TestButton onClick={handleClick}>Click me</TestButton>);
    
    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
    
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});`,

    vue: `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';

const TestButton = {
  props: ['onClick'],
  template: '<button @click="onClick" data-testid="test-button"><slot /></button>'
};

describe('Example Test', () => {
  it('should render and handle click', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(TestButton, {
      props: { onClick: handleClick },
      slots: { default: 'Click me' }
    });
    
    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
    
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});`,

    sveltekit: `import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte/svelte5';
import TestButton from './components/TestButton.svelte';

describe('Example Svelte Test', () => {
  it('should render and handle click', async () => {
    const handleClick = vi.fn();

    render(TestButton, { props: { onClick: handleClick, label: 'Click me' } });

    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');

    await fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});`,
  };

  // Если SvelteKit — создадим простой компонент для теста
  if (framework === 'sveltekit') {
    const componentDir = path.join(projectPath, 'tests', 'components');
    if (!fs.existsSync(componentDir)) fs.mkdirSync(componentDir, { recursive: true });

    const componentPath = path.join(componentDir, 'TestButton.svelte');
    const componentContent = `<script>
  export let onClick = () => {};
  export let label = 'Click me';
</script>

<button data-testid="test-button" on:click={onClick}>{label}</button>`;
    fs.writeFileSync(componentPath, componentContent);
  }

  const testContent = examples[framework] || examples.react;
  const testFileName = framework === 'sveltekit' ? 'example.svelte.test.ts' : 'example.test.js';
  const testPath = path.join(projectPath, 'tests', testFileName);

  fs.writeFileSync(testPath, testContent);
  console.log('✅ Создан пример теста');
}

/**
 * Главная функция настройки проекта
 */
export async function setupTestingEnvironment(projectPath = process.cwd()) {
  console.log('🚀 Начинаем настройку тестирования...\n');

  try {
    // Определяем тип проекта
    const framework = detectProjectType(projectPath);
    console.log(`📦 Обнаружен фреймворк: ${framework}`);

    // Получаем конфигурацию
    const config = getFrameworkConfig(framework);

    // Создаем директории
    createDirectories(projectPath);

    // Создаем конфигурационные файлы
    const vitestConfigPath = path.join(projectPath, 'vitest.config.js');
    fs.writeFileSync(vitestConfigPath, config.vitestConfig);
    console.log('✅ Создан vitest.config.js');

    const wrapperPath = path.join(projectPath, 'tests', 'utils', 'test-wrapper.js');
    fs.writeFileSync(wrapperPath, config.testWrapper);
    console.log('✅ Создан test-wrapper.js');

    // Создаем вспомогательные файлы
    createSetupFile(projectPath);
    createTestIds(projectPath);
    createFactories(projectPath);
    createExampleTest(projectPath, framework);

    // Обновляем package.json
    updatePackageJsonScripts(projectPath);

    console.log('\n🎉 Настройка завершена!');
    console.log('\n📋 Следующие шаги:');
    console.log('1. Установите зависимости:');
    console.log(`   npm install -D ${config.dependencies.join(' ')}`);
    console.log('2. Запустите тесты:');
    console.log('   npm run test');

    return {
      framework,
      dependencies: config.dependencies,
      success: true,
    };
  } catch (error) {
    console.error('❌ Ошибка при настройке:', error.message);
    return { success: false, error: error.message };
  }
}

// Экспорт для использования в CLI (кроссплатформенная проверка запуска напрямую)
try {
  const invoked =
    process.argv && process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
  if (import.meta.url === invoked) {
    setupTestingEnvironment();
  }
} catch {
  // Безопасное игнорирование в средах без process.argv
}
