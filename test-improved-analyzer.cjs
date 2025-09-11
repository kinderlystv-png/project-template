const analyzer = require('./eap-analyzer-dashboard/smart-analyzer.cjs');

// Тест UserService
const userServiceCode = `class UserService {
  constructor() {
    this.users = [];
  }

  addUser(user) {
    this.users.push(user);
  }

  findUser(id) {
    return this.users.find(u => u.id === id);
  }
}`;

const result1 = analyzer.smartComponentAnalyzer(
  'UserService.ts',
  'src/services/UserService.ts',
  userServiceCode,
  {}
);
console.log('=== UserService Analysis ===');
console.log('Type:', result1.type);
console.log('Logic Score:', result1.logicScore);
console.log('Functionality Score:', result1.functionalityScore);
console.log('Logic Issues:', result1.logicIssues);
console.log('Functionality Issues:', result1.functionalityIssues);
console.log('');

// Тест DuplicatedValidation
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

const result2 = analyzer.smartComponentAnalyzer(
  'DuplicatedValidation.ts',
  'src/validators/DuplicatedValidation.ts',
  dupCode,
  {}
);
console.log('=== DuplicatedValidation Analysis ===');
console.log('Type:', result2.type);
console.log('Logic Score:', result2.logicScore);
console.log('Functionality Score:', result2.functionalityScore);
console.log('Logic Issues:', result2.logicIssues);
console.log('Functionality Issues:', result2.functionalityIssues);
console.log('');

// Тест простого теста
const simpleTestCode = `// simple-template-test.js
console.log("Testing basic functionality");
if (2+2 === 4) {
  console.log("Math works");
}`;

const result3 = analyzer.smartComponentAnalyzer(
  'simple-template-test.js',
  'tests/simple-template-test.js',
  simpleTestCode,
  {}
);
console.log('=== Simple Test Analysis ===');
console.log('Type:', result3.type);
console.log('Logic Score:', result3.logicScore);
console.log('Functionality Score:', result3.functionalityScore);
console.log('Logic Issues:', result3.logicIssues);
console.log('Functionality Issues:', result3.functionalityIssues);
