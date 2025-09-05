<script lang="ts">
  export let currentSection: 'home' | 'calculator' | 'products' | '3d';

  let isMenuOpen = false;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function setSection(section: typeof currentSection) {
    currentSection = section;
    isMenuOpen = false;
  }
</script>

<header class="bg-white shadow-soft border-b border-gray-200 sticky top-0 z-40">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- Логотип -->
      <div class="flex items-center">
        <button
          class="text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
          on:click={() => setSection('home')}
        >
          SHINOMONTAGKA
        </button>
      </div>

      <!-- Навигация для десктопа -->
      <nav class="hidden md:flex items-center space-x-8">
        <button
          class="nav-link"
          class:active={currentSection === 'home'}
          on:click={() => setSection('home')}
        >
          Главная
        </button>
        <button
          class="nav-link"
          class:active={currentSection === 'calculator'}
          on:click={() => setSection('calculator')}
        >
          Калькуляторы
        </button>
        <button
          class="nav-link"
          class:active={currentSection === 'products'}
          on:click={() => setSection('products')}
        >
          Товары
        </button>
        <button
          class="nav-link"
          class:active={currentSection === '3d'}
          on:click={() => setSection('3d')}
        >
          3D Конструктор
        </button>
      </nav>

      <!-- Кнопка мобильного меню -->
      <button
        class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        on:click={toggleMenu}
        aria-label="Открыть меню"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {#if isMenuOpen}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          {:else}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          {/if}
        </svg>
      </button>
    </div>

    <!-- Мобильное меню -->
    {#if isMenuOpen}
      <div class="md:hidden py-4 border-t border-gray-200 animate-fade-in">
        <nav class="flex flex-col space-y-2">
          <button
            class="mobile-nav-link"
            class:active={currentSection === 'home'}
            on:click={() => setSection('home')}
          >
            Главная
          </button>
          <button
            class="mobile-nav-link"
            class:active={currentSection === 'calculator'}
            on:click={() => setSection('calculator')}
          >
            Калькуляторы
          </button>
          <button
            class="mobile-nav-link"
            class:active={currentSection === 'products'}
            on:click={() => setSection('products')}
          >
            Товары
          </button>
          <button
            class="mobile-nav-link"
            class:active={currentSection === '3d'}
            on:click={() => setSection('3d')}
          >
            3D Конструктор
          </button>
        </nav>
      </div>
    {/if}
  </div>
</header>

<style>
  .nav-link {
    @apply text-gray-600 font-medium transition-colors;
  }

  .nav-link:hover {
    @apply text-primary-600;
  }

  .nav-link.active {
    @apply text-primary-600;
  }

  .mobile-nav-link {
    @apply block px-4 py-2 text-gray-600 rounded-lg font-medium transition-colors text-left;
  }

  .mobile-nav-link:hover {
    @apply text-primary-600 bg-gray-50;
  }

  .mobile-nav-link.active {
    @apply text-primary-600 bg-primary-50;
  }
</style>
