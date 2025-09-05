<script lang="ts">
  import { onMount } from 'svelte';
  import { log } from './lib/logger';

  onMount(() => {
    log.info('Clean start page loaded successfully');
  });
</script>

<main class="container">
  <div class="start-project">
    <h1>начнем проект</h1>
    <p class="subtitle">SHINOMONTAGKA готов к разработке</p>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
    background-color: #f8f9fa;
    color: #212529;
    line-height: 1.5;
  }

  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }

  .start-project {
    text-align: center;
    padding: 2rem;
  }

  h1 {
    font-size: 3rem;
    font-weight: 300;
    color: #343a40;
    margin: 0 0 1rem 0;
  }

  .subtitle {
    font-size: 1.2rem;
    color: #6c757d;
    margin: 0;
    font-weight: 400;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 2rem;
    }
  }
</style>
