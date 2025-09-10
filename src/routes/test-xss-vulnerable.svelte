<!-- Тестовый Svelte файл с XSS уязвимостями -->
<script>
  export let userInput = '';
  export let htmlContent = '<script>alert(\\"XSS\\")</script>';
  export let unsafeData = 'potentially dangerous data';

  // Небезопасная обработка
  function handleUnsafeHTML() {
    document.getElementById('output').innerHTML = userInput;
  }
</script>

<!-- Критическая XSS уязвимость -->
{@html userInput}

<!-- Еще одна уязвимость -->
{@html htmlContent}

<!-- Безопасная версия (должна игнорироваться) -->
{@html DOMPurify.sanitize(htmlContent)}

<div>
  <!-- Небезопасный вывод параметров -->
  <p>Hello, {@html $page.url.searchParams.get('name')}</p>
</div>

<button on:click={handleUnsafeHTML}>Trigger XSS</button>

<div id="output"></div>

<style>
  /* Стили */
</style>
