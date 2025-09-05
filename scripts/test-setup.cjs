#!/usr/bin/env node

// Простой тест скрипта настройки
const fs = require('fs');
const path = require('path');

function testSetupScript() {
  console.log('🧪 Testing setup script...');
  
  // Проверяем, что файл существует
  const scriptPath = path.join(__dirname, 'setup-project.cjs');
  if (!fs.existsSync(scriptPath)) {
    console.error('❌ Setup script not found!');
    process.exit(1);
  }
  
  // Проверяем синтаксис
  try {
    require(scriptPath);
    console.log('✅ Setup script syntax is valid');
  } catch (error) {
    console.error('❌ Setup script has syntax errors:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Setup script test passed!');
}

if (require.main === module) {
  testSetupScript();
}
