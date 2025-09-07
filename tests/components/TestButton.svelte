<script>
  export let onClick = () => {};
  export let label = 'Click me';
</script>

<button data-testid="test-button" on:click={onClick}>{label}</button>
