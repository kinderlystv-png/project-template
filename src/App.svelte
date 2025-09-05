<script lang="ts">
  import { onMount } from 'svelte';
  import { log } from './lib/logger';
  // Импортируем нашу стартовую страницу
  import StartPage from './StartPage.svelte';

  onMount(() => {
    log.info('SHINOMONTAGKA Application started - clean version');
  });
</script>

<StartPage />
