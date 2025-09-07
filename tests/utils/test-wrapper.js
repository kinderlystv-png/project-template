import { render } from '@testing-library/svelte';

export function renderWithProviders(component, options = {}) {
  return render(component, options);
}
