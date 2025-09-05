#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function updateTemplate() {
  const templateConfigPath = path.join(process.cwd(), 'template.config.json');

  if (!fs.existsSync(templateConfigPath)) {
    console.error('❌ template.config.json не найден. Убедитесь что вы в папке шаблона.');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(templateConfigPath, 'utf8'));
  config.version = incrementVersion(config.version);
  config.lastUpdated = new Date().toISOString();

  fs.writeFileSync(templateConfigPath, JSON.stringify(config, null, 2));

  console.log(`✅ Шаблон обновлен до версии ${config.version}`);
}

function incrementVersion(version) {
  const parts = version.split('.').map(Number);
  parts[2]++; // Increment patch version
  return parts.join('.');
}

if (require.main === module) {
  updateTemplate();
}

module.exports = { updateTemplate };
