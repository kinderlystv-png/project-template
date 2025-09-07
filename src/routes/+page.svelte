<script lang="ts">
  import { onMount } from 'svelte';
  import { log } from '$lib/logger';

  onMount(() => {
    log.info('Clean start page loaded successfully');
  });
</script>

<svelte:head>
  <title>SHINOMONTAGKA Template</title>
  <meta name="description" content="Universal enterprise-grade SvelteKit template" />
</svelte:head>

<main class="container">
  <div class="start-project">
    <h1>SHINOMONTAGKA</h1>
    <p class="subtitle">Universal Template ready for development</p>
    <div class="features">
      <div class="feature">
        <h3>🚀 Ready to Use</h3>
        <p>Enterprise-grade infrastructure out of the box</p>
      </div>
      <div class="feature">
        <h3>⚡ High Performance</h3>
        <p>Optimized build system with Vite and SvelteKit</p>
      </div>
      <div class="feature">
        <h3>🛠 Developer Experience</h3>
        <p>TypeScript, testing, linting, and formatting configured</p>
      </div>
    </div>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #212529;
    line-height: 1.5;
    min-height: 100vh;
  }

  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 2rem;
  }

  .start-project {
    text-align: center;
    padding: 3rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    max-width: 900px;
  }

  h1 {
    font-size: 3.5rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0 0 1rem 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    font-size: 1.4rem;
    color: #4a5568;
    margin-bottom: 3rem;
    font-weight: 500;
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }

  .feature {
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .feature h3 {
    margin: 0 0 1rem 0;
    color: #2d3748;
    font-size: 1.2rem;
  }

  .feature p {
    margin: 0;
    color: #4a5568;
    font-size: 0.95rem;
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }
    
    .start-project {
      padding: 2rem;
    }
    
    h1 {
      font-size: 2.5rem;
    }
    
    .features {
      grid-template-columns: 1fr;
    }
  }
</style>
