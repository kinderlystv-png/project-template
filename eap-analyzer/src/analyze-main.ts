#!/usr/bin/env node

/**
 * Простой анализ проекта SHINOMONTAGKA
 */

import * as path from 'path';
import { DockerChecker } from './checkers/docker.js';
import { EMTChecker } from './checkers/emt.js';

async function analyzeMainProject() {
  // Анализируем родительскую папку (основной проект)
  const projectPath = path.resolve(process.cwd(), '..');

  const context = {
    projectPath,
    projectInfo: {
      name: 'SHINOMONTAGKA',
      version: '2.0.0',
      hasTypeScript: true,
      hasTests: true,
      hasDocker: true,
      hasCICD: true,
      dependencies: { production: 0, development: 0, total: 0 },
    },
    options: {
      projectPath,
      verbose: true,
    },
  };

  try {
    // eslint-disable-next-line no-console
    console.log('🔍 Анализ основного проекта SHINOMONTAGKA...');
    // eslint-disable-next-line no-console
    console.log(`📂 Путь: ${projectPath}`);
    // eslint-disable-next-line no-console
    console.log('');

    // Тест EMT
    // eslint-disable-next-line no-console
    console.log('📋 Анализ ЭМТ (Эталонный Модуль Тестирования)...');
    const emtResult = await EMTChecker.checkComponent(context);
    // eslint-disable-next-line no-console
    console.log(
      `✅ ЭМТ: ${emtResult.percentage}% (${emtResult.passed.length}/${emtResult.passed.length + emtResult.failed.length} проверок)`
    );

    if (emtResult.failed.length > 0) {
      // eslint-disable-next-line no-console
      console.log('   ❌ Не пройдены:');
      emtResult.failed.slice(0, 3).forEach(fail => {
        // eslint-disable-next-line no-console
        console.log(`      • ${fail.check.name}`);
      });
    }
    // eslint-disable-next-line no-console
    console.log('');

    // Тест Docker
    // eslint-disable-next-line no-console
    console.log('📋 Анализ Docker Infrastructure...');
    const dockerResult = await DockerChecker.checkComponent(context);
    // eslint-disable-next-line no-console
    console.log(
      `🐳 Docker: ${dockerResult.percentage}% (${dockerResult.passed.length}/${dockerResult.passed.length + dockerResult.failed.length} проверок)`
    );

    if (dockerResult.failed.length > 0) {
      // eslint-disable-next-line no-console
      console.log('   ❌ Не пройдены:');
      dockerResult.failed.slice(0, 3).forEach(fail => {
        // eslint-disable-next-line no-console
        console.log(`      • ${fail.check.name}`);
      });
    }
    // eslint-disable-next-line no-console
    console.log('');

    const totalScore = emtResult.score + dockerResult.score;
    const maxScore = emtResult.maxScore + dockerResult.maxScore;
    const overallPercentage = Math.round((totalScore / maxScore) * 100);

    // eslint-disable-next-line no-console
    console.log('🎯 ОБЩИЙ РЕЗУЛЬТАТ:');
    // eslint-disable-next-line no-console
    console.log(`   Оценка: ${overallPercentage}% (${totalScore}/${maxScore} баллов)`);

    let grade = 'F';
    if (overallPercentage >= 90) grade = 'A+';
    else if (overallPercentage >= 85) grade = 'A';
    else if (overallPercentage >= 80) grade = 'B+';
    else if (overallPercentage >= 75) grade = 'B';
    else if (overallPercentage >= 70) grade = 'C+';
    else if (overallPercentage >= 65) grade = 'C';
    else if (overallPercentage >= 60) grade = 'D';

    // eslint-disable-next-line no-console
    console.log(`   Оценка: ${grade}`);

    if (overallPercentage >= 85) {
      // eslint-disable-next-line no-console
      console.log('🎉 Отлично! Проект соответствует высоким стандартам!');
    } else if (overallPercentage >= 70) {
      // eslint-disable-next-line no-console
      console.log('👍 Хорошо! Есть области для улучшения.');
    } else {
      // eslint-disable-next-line no-console
      console.log('⚠️ Проект требует значительных улучшений.');
    }

    return { emtResult, dockerResult, overallPercentage, grade };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Ошибка:', error);
    throw error;
  }
}

// Запуск
analyzeMainProject().catch(console.error);
