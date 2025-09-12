/**
 * UAK (Universal Analytical Core) Adequacy Test
 * Проверка соответствия улучшенного анализатора требованиям
 */

const analyzer = require('./smart-analyzer.cjs');

// === ТЕСТОВЫЕ ДАННЫЕ ===

const testCases = [
  {
    name: 'UserService',
    filename: 'UserService.ts',
    filepath: 'src/services/UserService.ts',
    content: `class UserService {
      constructor() {
        this.users = [];
      }

      addUser(user) {
        this.users.push(user);
      }

      findUser(id) {
        return this.users.find(u => u.id === id);
      }
    }`,
    expectedType: 'SERVICE',
    expectedLogicMin: 65,
    expectedFunctionalityMin: 70
  },

  {
    name: 'DuplicatedValidation',
    filename: 'DuplicatedValidation.ts',
    filepath: 'src/validators/DuplicatedValidation.ts',
    content: `class DuplicatedValidation {
      validateEmail(email) {
        if (!email) return false;
        return email.includes('@');
      }

      validateEmail2(email) {
        if (!email) return false;
        return email.includes('@');
      }
    }`,
    expectedType: 'VALIDATOR',
    expectDuplication: true,
    expectedLogicMax: 65 // Должно быть снижено из-за дублирования
  },

  {
    name: 'BenchUtils',
    filename: 'BenchUtils.ts',
    filepath: 'tests/utils/BenchUtils.ts',
    content: `export class BenchUtils {
      static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        return Math.round(bytes / k) + ' KB';
      }

      static async runBenchmark(fn, iterations = 1000) {
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
          await fn();
        }
        return performance.now() - start;
      }
    }`,
    expectedType: 'PERFORMANCE_UTILS',
    expectedLogicMin: 70,
    expectedFunctionalityMin: 65
  },

  {
    name: 'vitest-config',
    filename: 'vitest.performance.config.ts',
    filepath: './vitest.performance.config.ts',
    content: `import { defineConfig } from 'vitest/config';
    import { cpus } from 'os';

    export default defineConfig({
      test: {
        poolOptions: {
          threads: {
            maxThreads: Math.max(1, cpus().length - 1),
            minThreads: 1
          }
        },
        benchmark: {
          reporters: ['verbose', 'html']
        }
      }
    });`,
    expectedType: 'TEST_CONFIG',
    expectedLogicMin: 50,
    expectedFunctionalityMin: 40
  },

  {
    name: 'SimpleUtility',
    filename: 'utils.ts',
    filepath: 'src/utils/utils.ts',
    content: `export function formatDate(date) {
      return date.toISOString().split('T')[0];
    }

    export function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }`,
    expectedType: 'UTILITY',
    expectedLogicMin: 55,
    expectedFunctionalityMin: 60
  }
];

// === ФУНКЦИИ ТЕСТИРОВАНИЯ ===

function runAdequacyTest() {
  console.log('🧪 UAK ADEQUACY TEST - Smart Analyzer v2.0');
  console.log('===========================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);

    try {
      const result = analyzer.smartComponentAnalyzer(
        testCase.filename,
        testCase.filepath,
        testCase.content,
        {}
      );

      const analysis = {
        name: testCase.name,
        actualType: result.type,
        expectedType: testCase.expectedType,
        logicScore: result.logicScore,
        functionalityScore: result.functionalityScore,
        improvements: result.improvements,
        passed: true,
        issues: []
      };

      // Проверка типа
      if (result.type !== testCase.expectedType) {
        analysis.passed = false;
        analysis.issues.push(`Type mismatch: expected ${testCase.expectedType}, got ${result.type}`);
      }

      // Проверка минимальных оценок логики
      if (testCase.expectedLogicMin && result.logicScore < testCase.expectedLogicMin) {
        analysis.passed = false;
        analysis.issues.push(`Logic score too low: expected >=${testCase.expectedLogicMin}, got ${result.logicScore}`);
      }

      // Проверка максимальных оценок логики (для случаев с проблемами)
      if (testCase.expectedLogicMax && result.logicScore > testCase.expectedLogicMax) {
        analysis.passed = false;
        analysis.issues.push(`Logic score too high: expected <=${testCase.expectedLogicMax}, got ${result.logicScore}`);
      }

      // Проверка функциональности
      if (testCase.expectedFunctionalityMin && result.functionalityScore < testCase.expectedFunctionalityMin) {
        analysis.passed = false;
        analysis.issues.push(`Functionality score too low: expected >=${testCase.expectedFunctionalityMin}, got ${result.functionalityScore}`);
      }

      // Проверка детекции дублирования
      if (testCase.expectDuplication) {
        if (!result.improvements.ANTI_DUPLICATION || result.improvements.ANTI_DUPLICATION < 0.1) {
          analysis.passed = false;
          analysis.issues.push('Duplication not detected as expected');
        }
      }

      results.push(analysis);

      if (analysis.passed) {
        console.log(`   ✅ PASSED`);
        console.log(`      Type: ${result.type} | Logic: ${result.logicScore}% | Functionality: ${result.functionalityScore}%`);
        passed++;
      } else {
        console.log(`   ❌ FAILED`);
        console.log(`      Type: ${result.type} | Logic: ${result.logicScore}% | Functionality: ${result.functionalityScore}%`);
        for (const issue of analysis.issues) {
          console.log(`      📋 ${issue}`);
        }
        failed++;
      }

    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
      failed++;
      results.push({
        name: testCase.name,
        passed: false,
        error: error.message
      });
    }

    console.log('');
  }

  // Итоговый отчет
  console.log('📊 FINAL RESULTS');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  const adequacyThreshold = 80; // 80% успешных тестов
  const actualSuccessRate = Math.round((passed / (passed + failed)) * 100);

  if (actualSuccessRate >= adequacyThreshold) {
    console.log(`\n🎉 UAK ADEQUACY TEST PASSED! (${actualSuccessRate}% >= ${adequacyThreshold}%)`);
    console.log('Smart Analyzer v2.0 meets adequacy requirements.');
  } else {
    console.log(`\n⚠️ UAK ADEQUACY TEST FAILED! (${actualSuccessRate}% < ${adequacyThreshold}%)`);
    console.log('Smart Analyzer v2.0 requires additional improvements.');
  }

  return results;
}

// Запуск тестов
if (require.main === module) {
  runAdequacyTest();
}

module.exports = { runAdequacyTest, testCases };
