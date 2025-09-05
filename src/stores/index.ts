import { writable, derived } from 'svelte/store';

// Глобальное состояние приложения
export const appState = writable({
  isLoading: false,
  currentSection: 'home',
  theme: 'light',
  isMobileMenuOpen: false,
});

// Состояние калькуляторов
export const calculatorStore = writable({
  history: [],
  favoriteCalculators: [],
  settings: {
    decimalPlaces: 2,
    useScientificNotation: false,
    soundEnabled: true,
  },
});

// Состояние товаров
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  description: string;
  tags: string[];
  inStock: boolean;
  discount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
}

export const productsStore = writable<Product[]>([]);

export const cartStore = writable<{
  items: Array<{ product: Product; quantity: number }>;
  total: number;
}>({
  items: [],
  total: 0,
});

export const wishlistStore = writable<Product[]>([]);

// Фильтры и сортировка товаров
export const productFilters = writable({
  category: '',
  priceMin: 0,
  priceMax: 100000,
  rating: 0,
  tags: [],
  inStockOnly: false,
  sortBy: 'name', // name, price, rating, newest
  sortOrder: 'asc', // asc, desc
});

// Интерфейсы для 3D конструктора
export interface Object3D {
  id: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  material: {
    color?: number;
    wireframe?: boolean;
  };
  userData?: any;
}

export interface HistoryAction {
  action: 'add' | 'remove' | 'update' | 'clear';
  object?: Object3D;
  objects?: Object3D[];
  newObject?: Object3D;
  timestamp: Date;
}

// Состояние 3D конструктора
export const constructor3DStore = writable<{
  objects: Object3D[];
  selectedObject: Object3D | null;
  tool: string;
  scene: any;
  history: HistoryAction[];
  settings: {
    showGrid: boolean;
    showAxes: boolean;
    enablePhysics: boolean;
    backgroundColor: string;
  };
}>({
  objects: [],
  selectedObject: null,
  tool: 'select',
  scene: null,
  history: [],
  settings: {
    showGrid: true,
    showAxes: true,
    enablePhysics: false,
    backgroundColor: '#1a1a1a',
  },
});

// Уведомления
export const notificationsStore = writable<
  Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    timestamp: Date;
  }>
>([]);

// Пользовательские настройки
export const userSettings = writable({
  language: 'ru',
  currency: 'RUB',
  theme: 'light',
  animations: true,
  notifications: true,
  autoSave: true,
});

// Производные stores
export const filteredProducts = derived(
  [productsStore, productFilters],
  ([$products, $filters]) => {
    let filtered = $products;

    // Фильтр по категории
    if ($filters.category) {
      filtered = filtered.filter(p => p.category === $filters.category);
    }

    // Фильтр по цене
    filtered = filtered.filter(p => p.price >= $filters.priceMin && p.price <= $filters.priceMax);

    // Фильтр по рейтингу
    if ($filters.rating > 0) {
      filtered = filtered.filter(p => p.rating >= $filters.rating);
    }

    // Фильтр по тегам
    if ($filters.tags.length > 0) {
      filtered = filtered.filter(p => $filters.tags.some(tag => p.tags.includes(tag)));
    }

    // Фильтр по наличию
    if ($filters.inStockOnly) {
      filtered = filtered.filter(p => p.inStock);
    }

    // Сортировка
    filtered.sort((a, b) => {
      const order = $filters.sortOrder === 'asc' ? 1 : -1;

      switch ($filters.sortBy) {
        case 'price':
          return (a.price - b.price) * order;
        case 'rating':
          return (a.rating - b.rating) * order;
        case 'newest':
          return (a.isNew ? 1 : 0) - (b.isNew ? 1 : 0) * order;
        default:
          return a.name.localeCompare(b.name) * order;
      }
    });

    return filtered;
  }
);

export const cartTotal = derived(cartStore, $cart => {
  return $cart.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
});

export const cartItemCount = derived(cartStore, $cart => {
  return $cart.items.reduce((count, item) => count + item.quantity, 0);
});

// Функции-хелперы для работы со store
export const addToCart = (product: Product, quantity: number = 1) => {
  cartStore.update(cart => {
    const existingItem = cart.items.find(item => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product, quantity });
    }

    cart.total = cart.items.reduce((total, item) => total + item.product.price * item.quantity, 0);

    return cart;
  });

  showNotification('success', 'Товар добавлен', `${product.name} добавлен в корзину`);
};

export const removeFromCart = (productId: string) => {
  cartStore.update(cart => {
    cart.items = cart.items.filter(item => item.product.id !== productId);
    cart.total = cart.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
    return cart;
  });
};

export const updateCartQuantity = (productId: string, quantity: number) => {
  cartStore.update(cart => {
    const item = cart.items.find(item => item.product.id === productId);
    if (item) {
      if (quantity <= 0) {
        cart.items = cart.items.filter(item => item.product.id !== productId);
      } else {
        item.quantity = quantity;
      }
    }
    cart.total = cart.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
    return cart;
  });
};

export const addToWishlist = (product: Product) => {
  wishlistStore.update(wishlist => {
    if (!wishlist.find(p => p.id === product.id)) {
      wishlist.push(product);
      showNotification('success', 'Добавлено в избранное', product.name);
    }
    return wishlist;
  });
};

export const removeFromWishlist = (productId: string) => {
  wishlistStore.update(wishlist => wishlist.filter(p => p.id !== productId));
};

export const showNotification = (
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message: string,
  duration: number = 5000
) => {
  const notification = {
    id: Date.now().toString(),
    type,
    title,
    message,
    duration,
    timestamp: new Date(),
  };

  notificationsStore.update(notifications => {
    notifications.push(notification);
    return notifications;
  });

  // Автоматическое удаление уведомления
  setTimeout(() => {
    removeNotification(notification.id);
  }, duration);
};

export const removeNotification = (id: string) => {
  notificationsStore.update(notifications => notifications.filter(n => n.id !== id));
};

// Сохранение в localStorage
export const saveToLocalStorage = (key: string, data: any) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
};

export const loadFromLocalStorage = (key: string, defaultValue: any = null) => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return defaultValue;
    }
  }
  return defaultValue;
};

// Инициализация данных из localStorage
if (typeof window !== 'undefined') {
  // Загружаем корзину
  const savedCart = loadFromLocalStorage('cart', { items: [], total: 0 });
  cartStore.set(savedCart);

  // Загружаем избранное
  const savedWishlist = loadFromLocalStorage('wishlist', []);
  wishlistStore.set(savedWishlist);

  // Загружаем настройки
  const savedSettings = loadFromLocalStorage('userSettings', {
    language: 'ru',
    currency: 'RUB',
    theme: 'light',
    animations: true,
    notifications: true,
    autoSave: true,
  });
  userSettings.set(savedSettings);

  // Подписываемся на изменения для автосохранения
  cartStore.subscribe(cart => {
    saveToLocalStorage('cart', cart);
  });

  wishlistStore.subscribe(wishlist => {
    saveToLocalStorage('wishlist', wishlist);
  });

  userSettings.subscribe(settings => {
    saveToLocalStorage('userSettings', settings);
  });
}

// Функции для работы с 3D конструктором
export const add3DObject = (objectData: Object3D) => {
  constructor3DStore.update(store => {
    store.objects.push(objectData);
    store.history.push({
      action: 'add',
      object: objectData,
      timestamp: new Date(),
    });
    return store;
  });
};

export const remove3DObject = (objectId: string) => {
  constructor3DStore.update(store => {
    const object = store.objects.find(obj => obj.id === objectId);
    store.objects = store.objects.filter(obj => obj.id !== objectId);

    if (object) {
      store.history.push({
        action: 'remove',
        object,
        timestamp: new Date(),
      });
    }

    return store;
  });
};

export const update3DObject = (objectId: string, updates: Partial<Object3D>) => {
  constructor3DStore.update(store => {
    const objectIndex = store.objects.findIndex(obj => obj.id === objectId);
    if (objectIndex !== -1) {
      const oldObject = { ...store.objects[objectIndex] };
      store.objects[objectIndex] = { ...store.objects[objectIndex], ...updates };

      store.history.push({
        action: 'update',
        object: oldObject,
        newObject: store.objects[objectIndex],
        timestamp: new Date(),
      });
    }
    return store;
  });
};

export const clear3DScene = () => {
  constructor3DStore.update(store => {
    const objects = [...store.objects];
    store.objects = [];
    store.selectedObject = null;

    store.history.push({
      action: 'clear',
      objects,
      timestamp: new Date(),
    });

    return store;
  });
};

// Экспорт типов для TypeScript
export type AppState = typeof appState;
export type NotificationType = 'success' | 'error' | 'warning' | 'info';
