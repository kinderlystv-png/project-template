<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let product: {
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
  };

  export let isCompact = false;
  export let showActions = true;

  const dispatch = createEventDispatcher();

  let imageLoaded = false;
  let isHovered = false;

  function handleImageLoad() {
    imageLoaded = true;
  }

  function addToCart() {
    dispatch('addToCart', { product });
  }

  function addToWishlist() {
    dispatch('addToWishlist', { product });
  }

  function quickView() {
    dispatch('quickView', { product });
  }

  function viewDetails() {
    dispatch('viewDetails', { product });
  }

  // Форматирование цены
  function formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  }

  // Расчет скидки
  function calculateDiscount(): number {
    if (product.originalPrice && product.price < product.originalPrice) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return product.discount || 0;
  }

  // Генерация звезд рейтинга
  function generateStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }

    if (hasHalfStar) {
      stars.push('half');
    }

    while (stars.length < 5) {
      stars.push('empty');
    }

    return stars;
  }

  onMount(() => {
    // Предзагрузка изображения
    const img = new Image();
    img.onload = handleImageLoad;
    img.src = product.image;
  });
</script>

<div
  class="product-card group" class:compact={isCompact}
  class:hovered={isHovered}
  on:mouseenter={() => (isHovered = true)}
  on:mouseleave={() => (isHovered = false)}
  in:fly={{ y: 50, duration: 500, delay: Math.random() * 200, easing: quintOut }}
>
  <!-- Изображение продукта -->
  <div class="product-image-container">
    <div class="relative overflow-hidden">
      {#if !imageLoaded}
        <div class="image-placeholder">
          <div class="loading-spinner"></div>
        </div>
      {/if}

      <img
        src={product.image}
        alt={product.name}
        class="product-image"
        class:loaded={imageLoaded}
        on:load={handleImageLoad}
        on:click={viewDetails}
      />

      <!-- Бейджи -->
      <div class="badges">
        {#if product.isNew}
          <span class="badge badge-new">НОВИНКА</span>
        {/if}
        {#if product.isFeatured}
          <span class="badge badge-featured">ХИТ</span>
        {/if}
        {#if calculateDiscount() > 0}
          <span class="badge badge-discount">-{calculateDiscount()}%</span>
        {/if}
        {#if !product.inStock}
          <span class="badge badge-out-of-stock">НЕТ В НАЛИЧИИ</span>
        {/if}
      </div>

      <!-- Быстрые действия -->
      {#if showActions && !isCompact}
        <div class="quick-actions" class:visible={isHovered}>
          <button
            class="quick-action-btn"
            title="Быстрый просмотр"
            on:click={quickView}
            in:scale={{ duration: 200, delay: 0 }}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>

          <button
            class="quick-action-btn"
            title="Добавить в избранное"
            on:click={addToWishlist}
            in:scale={{ duration: 200, delay: 50 }}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Информация о продукте -->
  <div class="product-info">
    <!-- Категория -->
    <div class="product-category">{product.category}</div>

    <!-- Название -->
    <h3 class="product-name" on:click={viewDetails}>{product.name}</h3>

    <!-- Описание (только для обычных карточек) -->
    {#if !isCompact}
      <p class="product-description">{product.description}</p>
    {/if}

    <!-- Рейтинг и отзывы -->
    <div class="rating-container">
      <div class="stars">
        {#each generateStars(product.rating) as star}
          <span class="star star-{star}">★</span>
        {/each}
      </div>
      <span class="rating-text">
        {product.rating} ({product.reviews} отзывов)
      </span>
    </div>

    <!-- Теги -->
    {#if !isCompact && product.tags.length > 0}
      <div class="tags">
        {#each product.tags.slice(0, 3) as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>
    {/if}

    <!-- Цена и действия -->
    <div class="product-footer">
      <div class="price-container">
        <span class="price">{formatPrice(product.price)}</span>
        {#if product.originalPrice && product.originalPrice > product.price}
          <span class="original-price">{formatPrice(product.originalPrice)}</span>
        {/if}
      </div>

      {#if showActions}
        <button
          class="add-to-cart-btn"
          class:disabled={!product.inStock}
          disabled={!product.inStock}
          on:click={addToCart}
          in:scale={{ duration: 200 }}
        >
          {#if product.inStock}
            В корзину
          {:else}
            Нет в наличии
          {/if}
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .product-card {
    @apply bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300
           hover:shadow-2xl hover:-translate-y-1 cursor-pointer;
    max-width: 320px;
  }

  .product-card.compact {
    @apply max-w-xs;
  }

  .product-image-container {
    @apply relative aspect-square overflow-hidden bg-gray-100;
  }

  .image-placeholder {
    @apply absolute inset-0 flex items-center justify-center bg-gray-200;
  }

  .loading-spinner {
    @apply w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin;
  }

  .product-image {
    @apply w-full h-full object-cover transition-all duration-500 opacity-0
           group-hover:scale-105 cursor-pointer;
  }

  .product-image.loaded {
    @apply opacity-100;
  }

  .badges {
    @apply absolute top-3 left-3 flex flex-col gap-2 z-10;
  }

  .badge {
    @apply px-2 py-1 text-xs font-bold rounded-full text-white;
  }

  .badge-new {
    @apply bg-green-500;
  }

  .badge-featured {
    @apply bg-red-500;
  }

  .badge-discount {
    @apply bg-orange-500;
  }

  .badge-out-of-stock {
    @apply bg-gray-500;
  }

  .quick-actions {
    @apply absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300
           opacity-0 translate-x-2;
  }

  .quick-actions.visible {
    @apply opacity-100 translate-x-0;
  }

  .quick-action-btn {
    @apply w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center
           text-gray-700 hover:bg-blue-500 hover:text-white transition-all duration-200
           backdrop-blur-sm shadow-lg hover:scale-110;
  }

  .product-info {
    @apply p-4 space-y-3;
  }

  .product-category {
    @apply text-sm text-gray-500 uppercase tracking-wide font-medium;
  }

  .product-name {
    @apply text-lg font-bold text-gray-900 line-clamp-2 hover:text-blue-600 
           transition-colors cursor-pointer;
  }

  .product-description {
    @apply text-sm text-gray-600 line-clamp-2;
  }

  .rating-container {
    @apply flex items-center gap-2;
  }

  .stars {
    @apply flex;
  }

  .star {
    @apply text-lg;
  }

  .star-full {
    @apply text-yellow-400;
  }

  .star-half {
    @apply text-yellow-400;
  }

  .star-empty {
    @apply text-gray-300;
  }

  .rating-text {
    @apply text-sm text-gray-600;
  }

  .tags {
    @apply flex flex-wrap gap-1;
  }

  .tag {
    @apply px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full;
  }

  .product-footer {
    @apply flex items-center justify-between mt-4;
  }

  .price-container {
    @apply flex flex-col;
  }

  .price {
    @apply text-xl font-bold text-gray-900;
  }

  .original-price {
    @apply text-sm text-gray-500 line-through;
  }

  .add-to-cart-btn {
    @apply px-4 py-2 bg-blue-500 text-white rounded-lg font-medium
           hover:bg-blue-600 transition-all duration-200 
           active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500;
  }

  .add-to-cart-btn.disabled {
    @apply bg-gray-400 cursor-not-allowed hover:bg-gray-400;
  }

  /* Анимации */
  .product-card:hover .product-image {
    transform: scale(1.05);
  }

  /* Адаптивность */
  @media (max-width: 640px) {
    .product-card {
      @apply max-w-full;
    }

    .product-name {
      @apply text-base;
    }

    .price {
      @apply text-lg;
    }
  }

  /* Утилиты для обрезки текста */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
