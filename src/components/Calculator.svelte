<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let title = 'Калькулятор';
  export let description = 'Универсальный калькулятор';
  export let isAdvanced = false;

  let display = '0';
  let previousValue = 0;
  let operation = '';
  let waitingForNewValue = false;
  let history: string[] = [];
  let showHistory = false;
  let memoryValue = 0;

  const dispatch = createEventDispatcher();

  // Основные математические операции
  const operators = {
    '+': (a: number, b: number) => a + b,
    '-': (a: number, b: number) => a - b,
    '×': (a: number, b: number) => a * b,
    '÷': (a: number, b: number) => (b !== 0 ? a / b : NaN),
    '%': (a: number, b: number) => a % b,
    '^': (a: number, b: number) => Math.pow(a, b),
  };

  // Научные функции
  const scientificFunctions = {
    sin: (x: number) => Math.sin(x),
    cos: (x: number) => Math.cos(x),
    tan: (x: number) => Math.tan(x),
    log: (x: number) => Math.log10(x),
    ln: (x: number) => Math.log(x),
    sqrt: (x: number) => Math.sqrt(x),
    exp: (x: number) => Math.exp(x),
    abs: (x: number) => Math.abs(x),
  };

  function inputNumber(num: string) {
    if (waitingForNewValue) {
      display = num;
      waitingForNewValue = false;
    } else {
      display = display === '0' ? num : display + num;
    }
  }

  function inputOperator(nextOperator: string) {
    const inputValue = parseFloat(display);

    if (previousValue === 0) {
      previousValue = inputValue;
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      if (isNaN(newValue)) {
        display = 'Ошибка';
        return;
      }

      display = `${parseFloat(newValue.toFixed(7))}`;
      previousValue = newValue;
    }

    waitingForNewValue = true;
    operation = nextOperator;
  }

  function calculate(firstValue: number, secondValue: number, operator: string): number {
    return operators[operator as keyof typeof operators]?.(firstValue, secondValue) ?? 0;
  }

  function performCalculation() {
    const inputValue = parseFloat(display);

    if (previousValue !== 0 && operation && !waitingForNewValue) {
      const newValue = calculate(previousValue, inputValue, operation);

      if (isNaN(newValue)) {
        display = 'Ошибка';
        return;
      }

      const calculation = `${previousValue} ${operation} ${inputValue} = ${newValue}`;
      history = [calculation, ...history.slice(0, 9)]; // Храним последние 10 вычислений

      display = `${parseFloat(newValue.toFixed(7))}`;
      previousValue = 0;
      operation = '';
      waitingForNewValue = true;

      dispatch('calculation', { result: newValue, history: calculation });
    }
  }

  function clearAll() {
    display = '0';
    previousValue = 0;
    operation = '';
    waitingForNewValue = false;
  }

  function clearEntry() {
    display = '0';
  }

  function deleteLast() {
    if (display.length > 1) {
      display = display.slice(0, -1);
    } else {
      display = '0';
    }
  }

  function performScientificFunction(func: string) {
    const value = parseFloat(display);
    const result = scientificFunctions[func as keyof typeof scientificFunctions]?.(value);

    if (isNaN(result)) {
      display = 'Ошибка';
    } else {
      display = `${parseFloat(result.toFixed(7))}`;
      waitingForNewValue = true;
    }
  }

  function toggleSign() {
    if (display !== '0') {
      display = display.startsWith('-') ? display.slice(1) : '-' + display;
    }
  }

  function addDecimal() {
    if (waitingForNewValue) {
      display = '0.';
      waitingForNewValue = false;
    } else if (display.indexOf('.') === -1) {
      display += '.';
    }
  }

  // Память калькулятора
  function memoryStore() {
    memoryValue = parseFloat(display);
  }

  function memoryRecall() {
    display = memoryValue.toString();
    waitingForNewValue = true;
  }

  function memoryClear() {
    memoryValue = 0;
  }

  function memoryAdd() {
    memoryValue += parseFloat(display);
  }

  // Горячие клавиши
  function handleKeydown(event: KeyboardEvent) {
    const key = event.key;

    if ('0123456789'.includes(key)) {
      inputNumber(key);
    } else if ('+-*/%'.includes(key)) {
      const operatorMap: { [key: string]: string } = {
        '+': '+',
        '-': '-',
        '*': '×',
        '/': '÷',
        '%': '%',
      };
      inputOperator(operatorMap[key]);
    } else if (key === 'Enter' || key === '=') {
      performCalculation();
    } else if (key === 'Escape') {
      clearAll();
    } else if (key === 'Backspace') {
      deleteLast();
    } else if (key === '.') {
      addDecimal();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div
  class="calculator-container max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
  in:fly={{ y: 50, duration: 500, easing: quintOut }}
>
  <!-- Заголовок -->
  <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
    <h3 class="text-xl font-bold">{title}</h3>
    <p class="text-blue-100 text-sm">{description}</p>
  </div>

  <!-- Дисплей -->
  <div class="p-4 bg-gray-50">
    <div class="bg-black text-white rounded-lg p-4 mb-2">
      <div class="text-right">
        {#if operation && previousValue}
          <div class="text-gray-400 text-sm">{previousValue} {operation}</div>
        {/if}
        <div class="text-3xl font-mono" id="display">{display}</div>
      </div>
    </div>

    <!-- Память и история -->
    <div class="flex justify-between items-center">
      <div class="flex space-x-2">
        {#if memoryValue !== 0}
          <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">M</span>
        {/if}
      </div>
      <button
        class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        on:click={() => (showHistory = !showHistory)}
      >
        История
      </button>
    </div>
  </div>

  <!-- История вычислений -->
  {#if showHistory && history.length > 0}
    <div class="px-4 pb-2 max-h-32 overflow-y-auto" transition:fly={{ y: -20, duration: 300 }}>
      <div class="bg-gray-100 rounded-lg p-2">
        {#each history as calculation}
          <div class="text-xs text-gray-600 py-1 border-b border-gray-200 last:border-b-0">
            {calculation}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Кнопки -->
  <div class="p-4">
    {#if isAdvanced}
      <!-- Научный калькулятор -->
      <div class="grid grid-cols-5 gap-2 mb-3">
        <!-- Функции памяти -->
        <button class="btn btn-memory" on:click={memoryClear}>MC</button>
        <button class="btn btn-memory" on:click={memoryRecall}>MR</button>
        <button class="btn btn-memory" on:click={memoryStore}>MS</button>
        <button class="btn btn-memory" on:click={memoryAdd}>M+</button>
        <button class="btn btn-clear" on:click={clearAll}>C</button>

        <!-- Научные функции -->
        <button class="btn btn-function" on:click={() => performScientificFunction('sin')}
          >sin</button
        >
        <button class="btn btn-function" on:click={() => performScientificFunction('cos')}
          >cos</button
        >
        <button class="btn btn-function" on:click={() => performScientificFunction('tan')}
          >tan</button
        >
        <button class="btn btn-function" on:click={() => performScientificFunction('log')}
          >log</button
        >
        <button class="btn btn-function" on:click={() => performScientificFunction('ln')}>ln</button
        >

        <button class="btn btn-function" on:click={() => performScientificFunction('sqrt')}
          >√</button
        >
        <button class="btn btn-function" on:click={() => inputOperator('^')}>x^y</button>
        <button class="btn btn-function" on:click={() => performScientificFunction('exp')}
          >exp</button
        >
        <button class="btn btn-function" on:click={() => performScientificFunction('abs')}
          >|x|</button
        >
        <button class="btn btn-operator" on:click={() => inputOperator('%')}>%</button>
      </div>
    {/if}

    <!-- Основные кнопки -->
    <div class="grid grid-cols-4 gap-3">
      <!-- Первый ряд -->
      <button class="btn btn-clear" on:click={clearAll}>C</button>
      <button class="btn btn-clear" on:click={clearEntry}>CE</button>
      <button class="btn btn-clear" on:click={deleteLast}>⌫</button>
      <button class="btn btn-operator" on:click={() => inputOperator('÷')}>÷</button>

      <!-- Второй ряд -->
      <button class="btn btn-number" on:click={() => inputNumber('7')}>7</button>
      <button class="btn btn-number" on:click={() => inputNumber('8')}>8</button>
      <button class="btn btn-number" on:click={() => inputNumber('9')}>9</button>
      <button class="btn btn-operator" on:click={() => inputOperator('×')}>×</button>

      <!-- Третий ряд -->
      <button class="btn btn-number" on:click={() => inputNumber('4')}>4</button>
      <button class="btn btn-number" on:click={() => inputNumber('5')}>5</button>
      <button class="btn btn-number" on:click={() => inputNumber('6')}>6</button>
      <button class="btn btn-operator" on:click={() => inputOperator('-')}>−</button>

      <!-- Четвертый ряд -->
      <button class="btn btn-number" on:click={() => inputNumber('1')}>1</button>
      <button class="btn btn-number" on:click={() => inputNumber('2')}>2</button>
      <button class="btn btn-number" on:click={() => inputNumber('3')}>3</button>
      <button class="btn btn-operator" on:click={() => inputOperator('+')}>+</button>

      <!-- Пятый ряд -->
      <button class="btn btn-number" on:click={toggleSign}>±</button>
      <button class="btn btn-number" on:click={() => inputNumber('0')}>0</button>
      <button class="btn btn-number" on:click={addDecimal}>.</button>
      <button class="btn btn-equals" on:click={performCalculation} in:scale={{ duration: 200 }}
        >=</button
      >
    </div>
  </div>
</div>

<style>
  .calculator-container {
    transition: all 0.3s ease;
  }

  .calculator-container:hover {
    transform: translateY(-2px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  .btn {
    @apply h-12 rounded-lg font-semibold text-lg transition-all duration-200 
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
           active:scale-95 select-none;
  }

  .btn-number {
    @apply bg-gray-100 hover:bg-gray-200 text-gray-800 
           hover:shadow-md active:bg-gray-300;
  }

  .btn-operator {
    @apply bg-blue-500 hover:bg-blue-600 text-white 
           hover:shadow-lg active:bg-blue-700;
  }

  .btn-equals {
    @apply bg-green-500 hover:bg-green-600 text-white 
           hover:shadow-lg active:bg-green-700 font-bold;
  }

  .btn-clear {
    @apply bg-red-500 hover:bg-red-600 text-white 
           hover:shadow-lg active:bg-red-700;
  }

  .btn-function {
    @apply bg-purple-500 hover:bg-purple-600 text-white text-sm
           hover:shadow-lg active:bg-purple-700;
  }

  .btn-memory {
    @apply bg-orange-500 hover:bg-orange-600 text-white text-sm
           hover:shadow-lg active:bg-orange-700;
  }

  #display {
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }

  /* Анимации для нажатий */
  .btn:active {
    transform: scale(0.95);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Адаптивность */
  @media (max-width: 480px) {
    .btn {
      @apply h-10 text-base;
    }

    #display {
      @apply text-2xl;
    }
  }
</style>
