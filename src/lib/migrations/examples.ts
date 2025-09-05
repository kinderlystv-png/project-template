import type { Migration } from './types.js';

/**
 * Создание миграции для инициализации схемы базы данных
 */
export function createInitialSchemaMigration(): Migration {
  return {
    version: '1.0.0',
    name: 'initial_schema',
    description: 'Create initial database schema',
    timestamp: Date.now(),
    async up() {
      // Создаем начальную структуру в localStorage
      const initialData = {
        users: [],
        products: [],
        orders: [],
        settings: {
          version: '1.0.0',
          theme: 'light',
          language: 'ru',
        },
      };

      // Сохраняем только если данных еще нет
      if (!localStorage.getItem('app_data')) {
        localStorage.setItem('app_data', JSON.stringify(initialData));
      }

      // Создаем индексы для быстрого поиска
      if (!localStorage.getItem('search_index')) {
        localStorage.setItem(
          'search_index',
          JSON.stringify({
            products: {},
            users: {},
            orders: {},
          })
        );
      }
    },
    async down() {
      // Удаляем созданную структуру
      localStorage.removeItem('app_data');
      localStorage.removeItem('search_index');
    },
  };
}

/**
 * Создание миграции для добавления пользовательских настроек
 */
export function createUserPreferencesMigration(): Migration {
  return {
    version: '1.1.0',
    name: 'user_preferences',
    description: 'Add user preferences and personalization',
    timestamp: Date.now(),
    dependencies: ['1.0.0'],
    async up() {
      // Добавляем новую структуру для пользовательских настроек
      const appDataStr = localStorage.getItem('app_data');
      if (appDataStr) {
        const appData = JSON.parse(appDataStr);

        // Добавляем новые поля
        if (!appData.userPreferences) {
          appData.userPreferences = {};
        }

        if (!appData.recentlyViewed) {
          appData.recentlyViewed = [];
        }

        if (!appData.favorites) {
          appData.favorites = [];
        }

        // Обновляем версию схемы
        appData.settings.version = '1.1.0';

        localStorage.setItem('app_data', JSON.stringify(appData));
      }

      // Создаем отдельное хранилище для кэша
      if (!localStorage.getItem('app_cache')) {
        localStorage.setItem(
          'app_cache',
          JSON.stringify({
            images: {},
            api_responses: {},
            search_results: {},
          })
        );
      }
    },
    async down() {
      // Откатываем изменения
      const appDataStr = localStorage.getItem('app_data');
      if (appDataStr) {
        const appData = JSON.parse(appDataStr);

        // Удаляем добавленные поля
        delete appData.userPreferences;
        delete appData.recentlyViewed;
        delete appData.favorites;

        // Откатываем версию
        appData.settings.version = '1.0.0';

        localStorage.setItem('app_data', JSON.stringify(appData));
      }

      // Удаляем кэш
      localStorage.removeItem('app_cache');
    },
  };
}

/**
 * Создание миграции для добавления системы уведомлений
 */
export function createNotificationSystemMigration(): Migration {
  return {
    version: '1.2.0',
    name: 'notification_system',
    description: 'Add notification system and message queue',
    timestamp: Date.now(),
    dependencies: ['1.1.0'],
    async up() {
      const appDataStr = localStorage.getItem('app_data');
      if (appDataStr) {
        const appData = JSON.parse(appDataStr);

        // Добавляем систему уведомлений
        if (!appData.notifications) {
          appData.notifications = {
            inbox: [],
            settings: {
              emailNotifications: true,
              pushNotifications: false,
              soundEnabled: true,
            },
            templates: {
              orderConfirmed: 'Ваш заказ #{orderId} подтвержден',
              orderShipped: 'Ваш заказ #{orderId} отправлен',
              priceAlert: 'Цена на товар изменилась',
            },
          };
        }

        // Добавляем очередь сообщений
        if (!appData.messageQueue) {
          appData.messageQueue = [];
        }

        appData.settings.version = '1.2.0';
        localStorage.setItem('app_data', JSON.stringify(appData));
      }
    },
    async down() {
      const appDataStr = localStorage.getItem('app_data');
      if (appDataStr) {
        const appData = JSON.parse(appDataStr);

        delete appData.notifications;
        delete appData.messageQueue;

        appData.settings.version = '1.1.0';
        localStorage.setItem('app_data', JSON.stringify(appData));
      }
    },
  };
}

/**
 * Создание миграции для оптимизации производительности
 */
export function createPerformanceOptimizationMigration(): Migration {
  return {
    version: '2.0.0',
    name: 'performance_optimization',
    description: 'Optimize data structure for better performance',
    timestamp: Date.now(),
    dependencies: ['1.2.0'],
    async up() {
      const appDataStr = localStorage.getItem('app_data');
      if (appDataStr) {
        const appData = JSON.parse(appDataStr);

        // Реструктуризация для лучшей производительности
        if (appData.products && Array.isArray(appData.products)) {
          // Конвертируем массив в объект для O(1) поиска
          const productsMap: Record<string, any> = {};
          appData.products.forEach((product: any, index: number) => {
            const id = product.id || `product_${index}`;
            productsMap[id] = product;
          });
          appData.products = productsMap;
        }

        // Аналогично для пользователей
        if (appData.users && Array.isArray(appData.users)) {
          const usersMap: Record<string, any> = {};
          appData.users.forEach((user: any, index: number) => {
            const id = user.id || `user_${index}`;
            usersMap[id] = user;
          });
          appData.users = usersMap;
        }

        // Добавляем метаданные для оптимизации
        appData.metadata = {
          lastOptimized: new Date().toISOString(),
          dataStructureVersion: '2.0',
          indices: {
            products: Object.keys(appData.products || {}),
            users: Object.keys(appData.users || {}),
          },
        };

        appData.settings.version = '2.0.0';
        localStorage.setItem('app_data', JSON.stringify(appData));
      }
    },
    async down() {
      const appDataStr = localStorage.getItem('app_data');
      if (appDataStr) {
        const appData = JSON.parse(appDataStr);

        // Конвертируем обратно в массивы
        if (appData.products && typeof appData.products === 'object') {
          appData.products = Object.values(appData.products);
        }

        if (appData.users && typeof appData.users === 'object') {
          appData.users = Object.values(appData.users);
        }

        delete appData.metadata;

        appData.settings.version = '1.2.0';
        localStorage.setItem('app_data', JSON.stringify(appData));
      }
    },
  };
}
