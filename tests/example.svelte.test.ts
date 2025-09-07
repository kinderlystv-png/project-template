import { fireEvent, render, screen } from '@testing-library/svelte/svelte5';
import { describe, expect, it, vi } from 'vitest';
import TestButton from './components/TestButton.svelte';

describe('Example Svelte Test', () => {
  it('should render and handle click', async () => {
    const handleClick = vi.fn();

    render(TestButton, { props: { onClick: handleClick, label: 'Click me' } });

    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');

    await fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
