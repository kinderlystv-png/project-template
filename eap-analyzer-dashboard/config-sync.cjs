#!/usr/bin/env node

/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                   CONFIG SYNC UTILITY                        ║
 * ║          Синхронизация критических файлов проекта            ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');

// Конфигурация синхронизации
const SYNC_CONFIG = {
  sourceDir: '..', // Корень проекта
  targetDir: '../eap-analyzer', // Папка анализатора
  criticalFiles: [
    'vitest.performance.config.ts',
    'vitest.config.ts',
    'package.json',
    'tsconfig.json',
  ],
};

/**
 * Проверяет нужна ли синхронизация файла
 */
function needsSync(sourceFile, targetFile) {
  if (!fs.existsSync(targetFile)) {
    return { needed: true, reason: 'Файл отсутствует в target' };
  }

  const sourceStat = fs.statSync(sourceFile);
  const targetStat = fs.statSync(targetFile);

  if (sourceStat.mtime > targetStat.mtime) {
    return {
      needed: true,
      reason: `Source новее (${sourceStat.mtime.toISOString()} vs ${targetStat.mtime.toISOString()})`,
    };
  }

  if (sourceStat.size !== targetStat.size) {
    return {
      needed: true,
      reason: `Разный размер (${sourceStat.size} vs ${targetStat.size} байт)`,
    };
  }

  return { needed: false, reason: 'Файлы идентичны' };
}

/**
 * Выполняет синхронизацию файла
 */
function syncFile(sourceFile, targetFile) {
  try {
    fs.copyFileSync(sourceFile, targetFile);
    const stat = fs.statSync(targetFile);
    return {
      success: true,
      size: stat.size,
      timestamp: stat.mtime.toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Главная функция синхронизации
 */
function main() {
  console.log('🔄 EAP Config Sync Utility');
  console.log('═'.repeat(50));

  let syncedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const filename of SYNC_CONFIG.criticalFiles) {
    const sourceFile = path.join(SYNC_CONFIG.sourceDir, filename);
    const targetFile = path.join(SYNC_CONFIG.targetDir, filename);

    console.log(`\\n📄 Проверка: ${filename}`);

    if (!fs.existsSync(sourceFile)) {
      console.log(`   ⚠️  Source файл не найден: ${sourceFile}`);
      errorCount++;
      continue;
    }

    const syncCheck = needsSync(sourceFile, targetFile);

    if (syncCheck.needed) {
      console.log(`   🔄 Синхронизация: ${syncCheck.reason}`);

      const result = syncFile(sourceFile, targetFile);

      if (result.success) {
        console.log(`   ✅ Синхронизирован: ${result.size} байт, ${result.timestamp}`);
        syncedCount++;
      } else {
        console.log(`   ❌ Ошибка: ${result.error}`);
        errorCount++;
      }
    } else {
      console.log(`   ✅ Пропущен: ${syncCheck.reason}`);
      skippedCount++;
    }
  }

  console.log('\\n' + '═'.repeat(50));
  console.log('📊 ИТОГО:');
  console.log(`   🔄 Синхронизировано: ${syncedCount}`);
  console.log(`   ⏭️  Пропущено: ${skippedCount}`);
  console.log(`   ❌ Ошибок: ${errorCount}`);

  if (syncedCount > 0) {
    console.log('\\n💡 Рекомендация: Перезапустите live-generator.cjs для обновления анализа');
  }

  if (errorCount > 0) {
    console.log('\\n⚠️  Внимание: Есть ошибки синхронизации!');
    process.exit(1);
  } else {
    console.log('\\n🎉 Синхронизация завершена успешно!');
  }
}

// Проверка аргументов командной строки
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔄 EAP Config Sync Utility

Синхронизирует критические файлы между корнем проекта и папкой eap-analyzer.

ИСПОЛЬЗОВАНИЕ:
  node config-sync.cjs           # Автоматическая синхронизация
  node config-sync.cjs --help    # Показать справку
  node config-sync.cjs --dry-run # Показать что будет синхронизировано (не выполнять)

ФАЙЛЫ ДЛЯ СИНХРОНИЗАЦИИ:
${SYNC_CONFIG.criticalFiles.map(f => '  - ' + f).join('\\n')}
  `);
  process.exit(0);
}

if (process.argv.includes('--dry-run')) {
  console.log('🧪 DRY RUN MODE - никакие файлы не будут изменены\\n');

  for (const filename of SYNC_CONFIG.criticalFiles) {
    const sourceFile = path.join(SYNC_CONFIG.sourceDir, filename);
    const targetFile = path.join(SYNC_CONFIG.targetDir, filename);

    if (fs.existsSync(sourceFile)) {
      const syncCheck = needsSync(sourceFile, targetFile);
      console.log(
        `📄 ${filename}: ${syncCheck.needed ? '🔄 SYNC NEEDED' : '✅ OK'} - ${syncCheck.reason}`
      );
    } else {
      console.log(`📄 ${filename}: ❌ SOURCE NOT FOUND`);
    }
  }
  process.exit(0);
}

// Запуск
main();
