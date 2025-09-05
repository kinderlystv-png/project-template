import { productsStore, type Product } from '../stores';

// Демонстрационные данные товаров
export const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Ноутбук Gaming Pro 15',
    price: 89999,
    originalPrice: 99999,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
    category: 'Электроника',
    rating: 4.8,
    reviews: 124,
    description:
      'Мощный игровой ноутбук с процессором Intel i7 и видеокартой RTX 4060. Идеален для игр и профессиональной работы.',
    tags: ['Gaming', 'Intel i7', 'RTX 4060', 'SSD'],
    inStock: true,
    discount: 10,
    isNew: true,
    isFeatured: true,
  },
  {
    id: '2',
    name: 'Смартфон ProMax 256GB',
    price: 74999,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
    category: 'Мобильные устройства',
    rating: 4.6,
    reviews: 89,
    description:
      'Флагманский смартфон с тройной камерой 48MP, дисплеем 6.7" OLED и быстрой зарядкой 65W.',
    tags: ['5G', 'OLED', '48MP Camera', 'Fast Charging'],
    inStock: true,
    isFeatured: true,
  },
  {
    id: '3',
    name: 'Беспроводные наушники AirPods Pro',
    price: 19999,
    originalPrice: 24999,
    image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop',
    category: 'Аудио',
    rating: 4.9,
    reviews: 203,
    description:
      'Премиальные беспроводные наушники с активным шумоподавлением и пространственным звуком.',
    tags: ['Wireless', 'ANC', 'Spatial Audio', 'Premium'],
    inStock: true,
    discount: 20,
  },
  {
    id: '4',
    name: 'Умные часы SportWatch Series 8',
    price: 34999,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    category: 'Носимая электроника',
    rating: 4.5,
    reviews: 67,
    description: 'Умные часы с GPS, мониторингом здоровья, водозащитой и батареей до 18 часов.',
    tags: ['GPS', 'Health Monitor', 'Waterproof', 'Long Battery'],
    inStock: true,
    isNew: true,
  },
  {
    id: '5',
    name: 'Планшет TabletPro 12.9"',
    price: 79999,
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=400&fit=crop',
    category: 'Планшеты',
    rating: 4.7,
    reviews: 156,
    description:
      'Профессиональный планшет с процессором M2, дисплеем Liquid Retina и поддержкой Apple Pencil.',
    tags: ['M2 Chip', 'Liquid Retina', 'Apple Pencil', 'Professional'],
    inStock: false,
  },
  {
    id: '6',
    name: 'Игровая мышь RGB Pro',
    price: 4999,
    originalPrice: 6999,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop',
    category: 'Периферия',
    rating: 4.4,
    reviews: 342,
    description:
      'Профессиональная игровая мышь с сенсором 25600 DPI, RGB подсветкой и программируемыми кнопками.',
    tags: ['Gaming', 'RGB', 'High DPI', 'Programmable'],
    inStock: true,
    discount: 29,
  },
  {
    id: '7',
    name: 'Механическая клавиатура RGB',
    price: 8999,
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop',
    category: 'Периферия',
    rating: 4.6,
    reviews: 89,
    description:
      'Механическая клавиатура с переключателями Cherry MX Blue, RGB подсветкой и макро-клавишами.',
    tags: ['Mechanical', 'Cherry MX', 'RGB', 'Macro Keys'],
    inStock: true,
  },
  {
    id: '8',
    name: 'Веб-камера 4K Ultra HD',
    price: 12999,
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=400&fit=crop',
    category: 'Периферия',
    rating: 4.3,
    reviews: 45,
    description:
      'Профессиональная веб-камера 4K с автофокусом, микрофоном с шумоподавлением и широким углом обзора.',
    tags: ['4K', 'Autofocus', 'Noise Cancelling', 'Wide Angle'],
    inStock: true,
    isNew: true,
  },
  {
    id: '9',
    name: 'Портативная колонка Bluetooth',
    price: 7999,
    originalPrice: 9999,
    image: 'https://images.unsplash.com/photo-1544470273-d45826ba2d34?w=400&h=400&fit=crop',
    category: 'Аудио',
    rating: 4.5,
    reviews: 178,
    description:
      'Компактная беспроводная колонка с мощным басом, водозащитой IPX7 и временем работы до 24 часов.',
    tags: ['Bluetooth', 'Waterproof', 'Long Battery', 'Portable'],
    inStock: true,
    discount: 20,
  },
  {
    id: '10',
    name: 'SSD накопитель 1TB NVMe',
    price: 8999,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop',
    category: 'Комплектующие',
    rating: 4.8,
    reviews: 267,
    description:
      'Высокоскоростной SSD накопитель с интерфейсом NVMe, скоростью чтения до 7000 МБ/с.',
    tags: ['NVMe', 'High Speed', '1TB', 'Storage'],
    inStock: true,
    isFeatured: true,
  },
  {
    id: '11',
    name: 'Монитор 27" 4K Gaming',
    price: 45999,
    originalPrice: 52999,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop',
    category: 'Мониторы',
    rating: 4.7,
    reviews: 93,
    description:
      'Игровой монитор 27" с разрешением 4K, частотой 144Hz, поддержкой HDR и временем отклика 1мс.',
    tags: ['4K', '144Hz', 'HDR', 'Gaming', '1ms'],
    inStock: true,
    discount: 13,
  },
  {
    id: '12',
    name: 'Роутер Wi-Fi 6E AX6000',
    price: 18999,
    image: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&h=400&fit=crop',
    category: 'Сетевое оборудование',
    rating: 4.4,
    reviews: 56,
    description:
      'Мощный роутер с поддержкой Wi-Fi 6E, скоростью до 6000 Мбит/с и покрытием до 500 м².',
    tags: ['Wi-Fi 6E', 'High Speed', 'Large Coverage', 'Gaming'],
    inStock: true,
    isNew: true,
  },
];

// Функция для загрузки демонстрационных данных
export const loadSampleData = () => {
  productsStore.set(sampleProducts);
};

// Функция для получения товаров по категории
export const getProductsByCategory = (category: string): Product[] => {
  return sampleProducts.filter(product => product.category === category);
};

// Функция для получения популярных товаров
export const getFeaturedProducts = (): Product[] => {
  return sampleProducts.filter(product => product.isFeatured);
};

// Функция для получения новинок
export const getNewProducts = (): Product[] => {
  return sampleProducts.filter(product => product.isNew);
};

// Функция для получения товаров со скидкой
export const getDiscountedProducts = (): Product[] => {
  return sampleProducts.filter(
    product =>
      (product.discount && product.discount > 0) ||
      (product.originalPrice && product.originalPrice > product.price)
  );
};

// Функция для поиска товаров
export const searchProducts = (query: string): Product[] => {
  const lowerQuery = query.toLowerCase();
  return sampleProducts.filter(
    product =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery) ||
      product.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// Функция для получения категорий
export const getCategories = (): string[] => {
  const categories = [...new Set(sampleProducts.map(product => product.category))];
  return categories.sort();
};

// Функция для получения всех тегов
export const getAllTags = (): string[] => {
  const allTags = sampleProducts.flatMap(product => product.tags);
  return [...new Set(allTags)].sort();
};

// Функция для получения статистики товаров
export const getProductStats = () => {
  const totalProducts = sampleProducts.length;
  const inStockProducts = sampleProducts.filter(p => p.inStock).length;
  const newProducts = sampleProducts.filter(p => p.isNew).length;
  const featuredProducts = sampleProducts.filter(p => p.isFeatured).length;
  const discountedProducts = getDiscountedProducts().length;

  const avgRating = sampleProducts.reduce((sum, p) => sum + p.rating, 0) / totalProducts;
  const totalReviews = sampleProducts.reduce((sum, p) => sum + p.reviews, 0);

  const priceRange = {
    min: Math.min(...sampleProducts.map(p => p.price)),
    max: Math.max(...sampleProducts.map(p => p.price)),
    avg: sampleProducts.reduce((sum, p) => sum + p.price, 0) / totalProducts,
  };

  return {
    totalProducts,
    inStockProducts,
    newProducts,
    featuredProducts,
    discountedProducts,
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews,
    priceRange,
    categories: getCategories().length,
    tags: getAllTags().length,
  };
};
