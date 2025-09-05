<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  // Компоненты
  import Header from './components/ui/Header.svelte';
  import Footer from './components/ui/Footer.svelte';
  import Calculator from './components/Calculator.svelte';
  import ProductCard from './components/ProductCard.svelte';
  import Constructor3D from './components/Constructor3D.svelte';

  // Stores и данные
  import { appState } from './stores';
  import { loadSampleData, getFeaturedProducts } from './data/products';

  let currentSection: 'home' | 'calculator' | 'products' | '3d' = 'home';
  let featuredProducts = [];

  // Загружаем демонстрационные данные при инициализации
  onMount(() => {
    loadSampleData();
    featuredProducts = getFeaturedProducts().slice(0, 3);
    console.log('SHINOMONTAGKA app loaded');
  });

  function setSection(section: typeof currentSection) {
    currentSection = section;
    appState.update(state => ({ ...state, currentSection: section }));
  }

  function handleProductAction(event: CustomEvent) {
    console.log('Product action:', event.detail);
    // Здесь можно добавить логику обработки действий с товарами
  }

  function handleCalculatorResult(event: CustomEvent) {
    console.log('Calculator result:', event.detail);
    // Здесь можно добавить логику сохранения результатов калькулятора
  }

  function handle3DAction(event: CustomEvent) {
    console.log('3D Constructor action:', event.detail);
    // Здесь можно добавить логику обработки действий 3D конструктора
  }
</script>

<svelte:head>
  <title>
    {currentSection === 'calculator'
      ? 'Калькуляторы - SHINOMONTAGKA'
      : currentSection === 'products'
        ? 'Товары - SHINOMONTAGKA'
        : currentSection === '3d'
          ? '3D Конструктор - SHINOMONTAGKA'
          : 'SHINOMONTAGKA - Веб-платформа'}
  </title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col">
  <Header bind:currentSection />

  <main class="flex-1">
    {#if currentSection === 'home'}
      <!-- Главная страница -->
      <section
        class="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white py-20"
      >
        <div class="container mx-auto px-4 text-center">
          <h1 class="text-5xl md:text-6xl font-bold mb-6 animate-fade-in-up">SHINOMONTAGKA</h1>
          <p
            class="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in-up"
            style:animation-delay="0.2s"
          >
            Современная веб-платформа с калькуляторами, карточками товаров и 3D конструктором
          </p>
          <div
            class="flex flex-wrap gap-4 justify-center animate-fade-in-up"
            style:animation-delay="0.4s"
          >
            <button class="btn-accent btn-lg" on:click={() => setSection('calculator')}>
              Калькуляторы
            </button>
            <button
              class="btn-outline btn-lg border-white text-white hover:bg-white hover:text-primary-600"
              on:click={() => setSection('products')}
            >
              Товары
            </button>
            <button
              class="btn-outline btn-lg border-white text-white hover:bg-white hover:text-primary-600"
              on:click={() => setSection('3d')}
            >
              3D Конструктор
            </button>
          </div>
        </div>
      </section>

      <!-- Секция возможностей -->
      <section class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <h2 class="text-3xl font-bold text-center mb-12 text-gray-900">Возможности платформы</h2>
          <div class="grid md:grid-cols-3 gap-8">
            <div class="card text-center p-8">
              <div class="text-4xl mb-4">🧮</div>
              <h3 class="text-xl font-semibold mb-3">Калькуляторы</h3>
              <p class="text-gray-600">
                Научные, финансовые и инженерные калькуляторы с современным интерфейсом
              </p>
            </div>
            <div class="card text-center p-8">
              <div class="text-4xl mb-4">🛍️</div>
              <h3 class="text-xl font-semibold mb-3">Карточки товаров</h3>
              <p class="text-gray-600">Интерактивные карточки с анимациями и фильтрацией</p>
            </div>
            <div class="card text-center p-8">
              <div class="text-4xl mb-4">🎨</div>
              <h3 class="text-xl font-semibold mb-3">3D Конструктор</h3>
              <p class="text-gray-600">Создавайте и редактируйте 3D модели прямо в браузере</p>
            </div>
          </div>
        </div>
      </section>
    {:else if currentSection === 'calculator'}
      <!-- Секция калькуляторов -->
      <section class="py-12" in:fly={{ y: 50, duration: 500, easing: quintOut }}>
        <div class="container mx-auto px-4">
          <h2 class="text-3xl font-bold text-center mb-8 text-gray-900">Калькуляторы</h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            <Calculator
              title="Обычный калькулятор"
              description="Базовые математические операции"
              on:calculation={handleCalculatorResult}
            />
            <Calculator
              title="Научный калькулятор"
              description="Тригонометрия, логарифмы, степени"
              isAdvanced={true}
              on:calculation={handleCalculatorResult}
            />
            <Calculator
              title="Инженерный калькулятор"
              description="Комплексные вычисления"
              isAdvanced={true}
              on:calculation={handleCalculatorResult}
            />
          </div>
        </div>
      </section>
    {:else if currentSection === 'products'}
      <!-- Секция товаров -->
      <section class="py-12" in:fly={{ y: 50, duration: 500, easing: quintOut }}>
        <div class="container mx-auto px-4">
          <h2 class="text-3xl font-bold text-center mb-8 text-gray-900">Каталог товаров</h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {#each featuredProducts as product}
              <ProductCard
                {product}
                on:addToCart={handleProductAction}
                on:addToWishlist={handleProductAction}
                on:quickView={handleProductAction}
                on:viewDetails={handleProductAction}
              />
            {/each}
          </div>
        </div>
      </section>
    {:else if currentSection === '3d'}
      <!-- Секция 3D конструктора -->
      <section class="py-12" in:fly={{ y: 50, duration: 500, easing: quintOut }}>
        <div class="container mx-auto px-4">
          <h2 class="text-3xl font-bold text-center mb-8 text-gray-900">3D Конструктор</h2>
          <div class="flex justify-center">
            <Constructor3D
              containerWidth={900}
              containerHeight={600}
              on:objectAdded={handle3DAction}
              on:objectSelected={handle3DAction}
              on:objectRemoved={handle3DAction}
              on:sceneCleared={handle3DAction}
            />
          </div>
        </div>
      </section>
    {/if}
  </main>

  <Footer />
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
