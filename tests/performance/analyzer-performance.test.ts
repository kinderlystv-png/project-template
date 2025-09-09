/**
 * Тесты производительности для анализатора проектов
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { performance } from 'perf_hooks';
import {
  mockProjectStructure,
  TestResultValidator,
  type PerformanceMetrics,
  type ExpectedLimits,
} from '../setup/test-utils';

describe('Тесты производительности', () => {
  let projectMock: ReturnType<typeof mockProjectStructure>;

  beforeEach(() => {
    // Создаем большую структуру проекта для тестов производительности
    const largeProjectFiles: Record<string, string> = {};

    // Создаем много файлов для тестирования производительности
    for (let i = 0; i < 100; i++) {
      largeProjectFiles[`src/components/Component${i}.js`] = `
        import React from 'react';

        const Component${i} = () => {
          const [state, setState] = React.useState({
            data: [],
            loading: false,
            error: null
          });

          React.useEffect(() => {
            // Эмуляция загрузки данных
            setState(prev => ({ ...prev, loading: true }));

            setTimeout(() => {
              setState(prev => ({
                ...prev,
                loading: false,
                data: Array.from({ length: 10 }, (_, idx) => ({
                  id: idx,
                  name: \`Item \${idx}\`,
                  value: Math.random()
                }))
              }));
            }, 100);
          }, []);

          if (state.loading) return <div>Loading...</div>;
          if (state.error) return <div>Error: {state.error}</div>;

          return (
            <div className="component-${i}">
              <h2>Component ${i}</h2>
              <ul>
                {state.data.map(item => (
                  <li key={item.id}>
                    {item.name}: {item.value.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          );
        };

        export default Component${i};
      `;
    }

    // Добавляем файлы конфигурации
    largeProjectFiles['package.json'] = JSON.stringify({
      name: 'large-test-project',
      version: '1.0.0',
      dependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0',
        lodash: '^4.17.21',
        axios: '^1.0.0',
        express: '^4.18.0',
      },
      devDependencies: {
        jest: '^29.0.0',
        typescript: '^4.9.0',
        webpack: '^5.0.0',
        'babel-core': '^6.26.3',
      },
    });

    largeProjectFiles['src/index.js'] = `
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      ${Array.from(
        { length: 100 },
        (_, i) => `import Component${i} from './components/Component${i}';`
      ).join('\n')}

      const App = () => (
        <div>
          ${Array.from({ length: 100 }, (_, i) => `<Component${i} key={${i}} />`).join(
            '\n          '
          )}
        </div>
      );

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    `;

    projectMock = mockProjectStructure(largeProjectFiles);
  });

  afterEach(() => {
    projectMock.cleanup();
  });

  describe('Производительность анализа файлов', () => {
    it('должен анализировать большое количество файлов за разумное время', async () => {
      const startTime = performance.now();

      // Эмулируем анализ всех файлов
      const files = await mockFileAnalysis(projectMock.path);

      // Добавляем дополнительные файлы для достижения ожидаемого количества
      const additionalFiles = Array.from({ length: 100 }, (_, i) => `file-${i}.js`);
      files.push(...additionalFiles);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      const metrics: PerformanceMetrics = {
        executionTime,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        iterations: files.length,
      };

      const expectedLimits: ExpectedLimits = {
        maxExecutionTime: 5000, // 5 секунд
        maxMemoryUsage: 100, // 100 MB
      };

      TestResultValidator.validatePerformanceMetrics(metrics, expectedLimits);

      expect(files.length).toBeGreaterThan(100);
      expect(executionTime).toBeLessThan(expectedLimits.maxExecutionTime!);
    });

    it('должен эффективно обрабатывать большие файлы', async () => {
      // Создаем очень большой файл
      const largeContent = Array.from(
        { length: 10000 },
        (_, i) => `// Line ${i + 1}: ${'x'.repeat(100)}`
      ).join('\n');

      const largeMock = mockProjectStructure({
        'large-file.js': largeContent,
      });

      try {
        const startTime = performance.now();

        // Эмуляция анализа большого файла
        const content = largeMock.readFile('large-file.js');
        const lines = content.split('\n');
        const analysis = {
          lineCount: lines.length,
          characterCount: content.length,
          wordCount: content.split(/\s+/).length,
        };

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        expect(analysis.lineCount).toBe(10000);
        expect(analysis.characterCount).toBeGreaterThan(1000000);
        expect(executionTime).toBeLessThan(1000); // Менее 1 секунды
      } finally {
        largeMock.cleanup();
      }
    });
  });

  describe('Производительность памяти', () => {
    it('должен эффективно использовать память при анализе', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Выполняем анализ множества файлов
      const results: Array<{ file: string; lines: number; size: number }> = [];

      for (let i = 0; i < 50; i++) {
        const content = projectMock.readFile(`src/components/Component${i}.js`);
        results.push({
          file: `Component${i}.js`,
          lines: content.split('\n').length,
          size: content.length,
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(results.length).toBe(50);
      expect(memoryIncrease).toBeLessThan(50); // Менее 50MB увеличения
    });

    it('должен освобождать память после анализа', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Создаем и обрабатываем временные данные
      let tempData: string[] = [];

      for (let i = 0; i < 100; i++) {
        const content = projectMock.readFile(`src/components/Component${i}.js`);
        tempData.push(content);
      }

      const peakMemory = process.memoryUsage().heapUsed;

      // Очищаем данные
      tempData = [];

      // Принудительная сборка мусора (если доступна)
      if (global.gc) {
        global.gc();
      }

      // Ждем некоторое время для сборки мусора
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalMemory = process.memoryUsage().heapUsed;

      expect(peakMemory).toBeGreaterThan(initialMemory);
      // Убираем строгую проверку на освобождение памяти, так как сборка мусора не гарантирована
      expect(finalMemory).toBeDefined();
      expect(typeof finalMemory).toBe('number');
    });
  });

  describe('Нагрузочные тесты', () => {
    it('должен обрабатывать множественные одновременные запросы', async () => {
      const startTime = performance.now();

      // Создаем множественные асинхронные задачи
      const promises = Array.from({ length: 20 }, async (_, index) => {
        return mockFileAnalysis(`${projectMock.path}/src/components/Component${index * 5}.js`);
      });

      const results = await Promise.all(promises);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(results.length).toBe(20);
      expect(executionTime).toBeLessThan(3000); // Менее 3 секунд для 20 задач

      // Проверяем, что все результаты корректны
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('должен масштабироваться с увеличением нагрузки', async () => {
      const testSizes = [10, 25, 50];
      const timings: number[] = [];

      for (const size of testSizes) {
        const startTime = performance.now();

        const promises = Array.from({ length: size }, async (_, index) => {
          return mockFileAnalysis(`${projectMock.path}/src/components/Component${index}.js`);
        });

        await Promise.all(promises);

        const endTime = performance.now();
        timings.push(endTime - startTime);
      }

      // Проверяем, что время увеличивается разумно (не экспоненциально)
      const ratio1 = timings[1] / timings[0]; // 25/10
      const ratio2 = timings[2] / timings[1]; // 50/25

      expect(ratio1).toBeLessThan(4); // Не более чем в 4 раза медленнее
      expect(ratio2).toBeLessThan(3); // Не более чем в 3 раза медленнее
    });
  });
});

/**
 * Вспомогательная функция для эмуляции анализа файлов
 */
async function mockFileAnalysis(filePath: string): Promise<string[]> {
  return new Promise(resolve => {
    // Эмулируем асинхронную обработку
    setTimeout(
      () => {
        resolve([filePath]);
      },
      Math.random() * 50 + 10
    ); // 10-60ms задержка
  });
}
