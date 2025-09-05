# 🚀 Руководство по настройке окружения разработки

## ✅ Что уже настроено

### 1. БАЗОВАЯ КОНФИГУРАЦИЯ

- ✅ **Package.json** с современными зависимостями
- ✅ **Vite + TypeScript** конфигурация
- ✅ **Svelte** для UI компонентов
- ✅ **Three.js** для 3D графики
- ✅ **GSAP & Lottie** для анимаций
- ✅ **Tailwind CSS** для стилизации

### 2. ЛИНТЕРЫ И ФОРМАТТЕРЫ

- ✅ **ESLint** конфигурация с TypeScript поддержкой
- ✅ **Prettier** для автоматического форматирования
- ✅ **Git hooks** с Husky для pre-commit проверок
- ✅ **Lint-staged** для проверки только измененных файлов

### 3. ТЕСТИРОВАНИЕ

- ✅ **Vitest** для unit-тестирования
- ✅ **jsdom** для тестирования DOM
- ✅ **Моки** для browser APIs и библиотек
- ✅ **Покрытие кода** с v8 provider
- ✅ **Тестовые утилиты** для калькуляторов и 3D

### 4. CI/CD

- ✅ **GitHub Actions** workflows
- ✅ **Автоматические проверки PR**
- ✅ **Deploy на GitHub Pages**
- ✅ **Security audit** и **Bundle analysis**

## 🛠️ Команды для работы

### Разработка

```bash
npm run dev          # Запуск dev сервера (http://localhost:3000)
npm run build        # Сборка для продакшена
npm run preview      # Предварительный просмотр сборки
```

### Тестирование

```bash
npm run test         # Запуск тестов в watch режиме
npm run test:run     # Одноразовый запуск тестов
npm run test:ui      # Запуск тестов с веб UI
npm run test:coverage # Запуск с покрытием кода
```

### Качество кода

```bash
npm run lint         # Линтинг и автофикс
npm run format       # Форматирование кода
npm run type-check   # Проверка типов TypeScript
```

## 📁 Структура проекта

```
SHINOMONTAGKA/
├── .github/
│   └── workflows/           # GitHub Actions
├── .husky/                  # Git hooks
├── src/
│   ├── components/         # Svelte компоненты
│   ├── stores/            # Глобальные состояния
│   ├── utils/             # Утилиты и хелперы
│   ├── types/             # TypeScript типы
│   ├── test/              # Тестовые утилиты
│   └── assets/            # Статические ресурсы
├── tests/                 # Тесты
├── dist/                  # Готовая сборка
└── docs/                  # Документация
```

## 🔧 Следующие шаги для разработки

### 1. Создайте основные компоненты:

```bash
# Калькулятор
src/components/Calculator/
├── Calculator.svelte
├── CalculatorButton.svelte
└── CalculatorDisplay.svelte

# Карточки товаров
src/components/ProductCard/
├── ProductCard.svelte
├── ProductImage.svelte
└── ProductInfo.svelte

# 3D Конструктор
src/components/Constructor3D/
├── Scene3D.svelte
├── Controls3D.svelte
└── Toolbar3D.svelte
```

### 2. Настройте стейт менеджмент:

```typescript
// src/stores/calculator.ts
import { writable } from 'svelte/store';

export const calculatorState = writable({
  display: '0',
  operation: null,
  previousValue: null,
});

// src/stores/products.ts
export const productStore = writable([]);
export const cartStore = writable([]);

// src/stores/scene3d.ts
export const sceneStore = writable({
  objects: [],
  camera: { position: [0, 0, 5] },
  lighting: { ambient: 0.4 },
});
```

### 3. Создайте утилиты:

```typescript
// src/utils/calculations.ts
export class Calculator {
  static add(a: number, b: number): number {
    return a + b;
  }
  static subtract(a: number, b: number): number {
    return a - b;
  }
  // ... другие операции
}

// src/utils/animations.ts
import gsap from 'gsap';

export class AnimationManager {
  static fadeIn(element: HTMLElement, duration = 0.3) {
    return gsap.from(element, { opacity: 0, duration });
  }
}

// src/utils/three-helpers.ts
import * as THREE from 'three';

export class Scene3DManager {
  static createScene(): THREE.Scene {
    return new THREE.Scene();
  }
}
```

## 🧪 Примеры тестов

```typescript
// tests/calculator.test.ts
import { Calculator } from '@/utils/calculations';

describe('Calculator', () => {
  it('should add numbers correctly', () => {
    expect(Calculator.add(2, 3)).toBe(5);
  });
});

// tests/product-card.test.ts
import { render } from '@testing-library/svelte';
import ProductCard from '@/components/ProductCard.svelte';

describe('ProductCard', () => {
  it('should render product information', () => {
    const { getByText } = render(ProductCard, {
      props: { product: { name: 'Test Product', price: 100 } },
    });

    expect(getByText('Test Product')).toBeInTheDocument();
  });
});
```

## 🎨 Настройка стилей

Создайте систему дизайна:

```scss
// src/styles/variables.scss
:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --accent-color: #f59e0b;

  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;

  --border-radius: 0.5rem;
  --transition: all 0.3s ease;
}

// src/styles/animations.scss
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

## 🚢 Деплой

### GitHub Pages (автоматический)

1. Push в main ветку
2. GitHub Actions автоматически соберет и задеплоит проект
3. Сайт будет доступен по адресу: `https://username.github.io/SHINOMONTAGKA`

### Ручной деплой

```bash
npm run build
# Загрузите содержимое папки dist/ на ваш хостинг
```

## 📚 Полезные ресурсы

- [Svelte документация](https://svelte.dev/docs)
- [Three.js примеры](https://threejs.org/examples/)
- [GSAP анимации](https://greensock.com/docs/)
- [Vitest тестирование](https://vitest.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🎯 Готово к разработке!

Ваше окружение полностью настроено и готово к разработке современного веб-приложения. Все инструменты интегрированы и работают автоматически:

✅ Разработка с hot reload  
✅ Автоматические тесты  
✅ Проверка качества кода  
✅ CI/CD пайплайн  
✅ Автоматический деплой

Начинайте создавать потрясающие калькуляторы, карточки товаров и 3D конструкторы! 🚀
