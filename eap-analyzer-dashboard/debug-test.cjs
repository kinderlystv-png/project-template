const analyzer = require('./smart-analyzer.cjs');

const dupCode = `class DuplicatedValidation {
  validateEmail(email) {
    if (!email) return false;
    return email.includes('@');
  }

  validateEmail2(email) {
    if (!email) return false;
    return email.includes('@');
  }
}`;

console.log('=== Debugging DuplicatedValidation ===');
const result = analyzer.smartComponentAnalyzer(
  'DuplicatedValidation.ts',
  'src/validators/DuplicatedValidation.ts',
  dupCode,
  {}
);
console.log('Type:', result.type);
console.log('Improvements found:', result.improvements);
console.log('ANTI_DUPLICATION:', result.improvements.ANTI_DUPLICATION);

console.log('\n=== Debugging BenchUtils ===');
const benchCode = `export class BenchUtils {
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
}`;

const result2 = analyzer.smartComponentAnalyzer(
  'BenchUtils.ts',
  'tests/utils/BenchUtils.ts',
  benchCode,
  {}
);
console.log('Type:', result2.type);
console.log('Base Scores:', result2.baseScores);
console.log('Size Adjustment:', result2.sizeAdjustment);
console.log('Logic Score:', result2.logicScore);
console.log('Functionality Score:', result2.functionalityScore);
