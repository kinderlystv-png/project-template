/**
 * Docker Security Checker - проверяет безопасность Docker конфигураций
 */

import { BaseChecker } from '../../../core/checker.js';
import { CheckContext, CheckResult } from '../../../core/types.js';

export class DockerSecurityChecker extends BaseChecker {
  readonly name = 'Docker Security Checker';
  readonly category = 'security' as const;
  readonly description = 'Проверяет безопасность Docker конфигураций и контейнеров';

  async check(context: CheckContext): Promise<CheckResult> {
    const path = require('path');
    const fs = require('fs');

    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      let score = 100;

      // Проверка Dockerfile на безопасность
      const dockerfilePath = path.join(context.projectPath, 'Dockerfile');

      if (fs.existsSync(dockerfilePath)) {
        const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
        const lines = dockerfileContent.split('\n').map((line: string) => line.trim());

        // Проверка USER инструкции
        const userLines = lines.filter((line: string) => line.startsWith('USER'));
        const hasNonRootUser = userLines.some(
          (line: string) =>
            !line.includes('USER root') && !line.includes('USER 0') && line.includes('USER')
        );

        if (!hasNonRootUser) {
          issues.push('Контейнер запускается от root пользователя');
          score -= 30;
          recommendations.push(
            'Создайте non-root пользователя: RUN adduser --disabled-password --gecos "" appuser && USER appuser'
          );
        }

        // Проверка секретов и паролей
        const sensitivePatterns = [
          /password\s*=/i,
          /secret\s*=/i,
          /api[_-]?key\s*=/i,
          /token\s*=/i,
          /--password/i,
        ];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          for (const pattern of sensitivePatterns) {
            if (pattern.test(line)) {
              issues.push(`Строка ${i + 1}: Обнаружены чувствительные данные в Dockerfile`);
              score -= 40;
              recommendations.push(
                'Используйте Docker secrets или переменные окружения для чувствительных данных'
              );
              break;
            }
          }
        }

        // Проверка небезопасных команд
        const dangerousCommands = [
          { pattern: /chmod\s+777/, message: 'Небезопасные права доступа (777)' },
          { pattern: /curl.*\|\s*sh/, message: 'Выполнение скрипта из интернета через pipe' },
          { pattern: /wget.*\|\s*sh/, message: 'Выполнение скрипта из интернета через pipe' },
          { pattern: /ADD.*http/, message: 'Использование ADD с HTTP URL небезопасно' },
        ];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          for (const danger of dangerousCommands) {
            if (danger.pattern.test(line)) {
              warnings.push(`Строка ${i + 1}: ${danger.message}`);
              score -= 15;
            }
          }
        }

        // Проверка базового образа
        const fromLines = lines.filter((line: string) => line.startsWith('FROM'));
        for (const fromLine of fromLines) {
          if (fromLine.includes(':latest')) {
            warnings.push('Использование :latest тега небезопасно для продакшена');
            score -= 10;
            recommendations.push('Зафиксируйте конкретную версию базового образа');
          }

          if (fromLine.includes('FROM ubuntu') && !fromLine.includes('ubuntu:')) {
            warnings.push('Использование полного Ubuntu образа вместо минимального');
            score -= 5;
          }
        }

        // Проверка HEALTHCHECK
        if (!lines.some((line: string) => line.startsWith('HEALTHCHECK'))) {
          warnings.push('Отсутствует HEALTHCHECK для мониторинга состояния контейнера');
          score -= 10;
          recommendations.push('Добавьте HEALTHCHECK инструкцию для мониторинга');
        }
      } else {
        // Если Dockerfile отсутствует, это не ошибка безопасности
        return this.createResult(true, 100, 'No Dockerfile found - security check not applicable', {
          reason: 'No Docker configuration',
        });
      }

      // Проверка docker-compose.yml на безопасность
      const composeFiles = ['docker-compose.yml', 'docker-compose.yaml'];

      for (const composeFile of composeFiles) {
        const composePath = path.join(context.projectPath, composeFile);

        if (fs.existsSync(composePath)) {
          const composeContent = fs.readFileSync(composePath, 'utf-8');

          // Проверка privileged режима
          if (composeContent.includes('privileged: true')) {
            issues.push(
              'Обнаружен privileged режим в docker-compose - критическая угроза безопасности'
            );
            score -= 35;
            recommendations.push('Избегайте privileged режима или используйте capabilities');
          }

          // Проверка volumes
          if (composeContent.includes(':/')) {
            const volumeLines = composeContent
              .split('\n')
              .filter((line: string) => line.includes(':/') && line.includes('volumes:'));
            for (const volumeLine of volumeLines) {
              if (volumeLine.includes('/:/') || volumeLine.includes('/:')) {
                issues.push('Монтирование корневой файловой системы - критическая угроза');
                score -= 40;
              }

              if (volumeLine.includes('/etc:/etc') || volumeLine.includes('/etc:')) {
                warnings.push('Монтирование /etc директории может быть небезопасным');
                score -= 20;
              }
            }
          }

          // Проверка network режима
          if (composeContent.includes('network_mode: host')) {
            warnings.push('network_mode: host обходит Docker сетевую изоляцию');
            score -= 15;
          }

          // Проверка environment переменных с секретами
          const envLines = composeContent
            .split('\n')
            .filter(
              (line: string) =>
                line.includes('environment:') ||
                line.includes('PASSWORD=') ||
                line.includes('SECRET=')
            );
          if (envLines.length > 0) {
            warnings.push('Чувствительные данные в environment - используйте secrets');
            score -= 10;
            recommendations.push(
              'Используйте Docker secrets вместо environment переменных для чувствительных данных'
            );
          }
        }
      }

      // Финальная оценка
      score = Math.max(0, score);
      const passed = issues.length === 0 && score >= 70;

      return this.createResult(
        passed,
        score,
        `Docker security check ${passed ? 'passed' : 'failed'} (${score}/100)`,
        { issues, warnings },
        recommendations
      );
    } catch (error) {
      return this.createResult(false, 0, 'Docker security check failed', [
        `Ошибка проверки безопасности Docker: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      ]);
    }
  }

  isApplicable(context: CheckContext): boolean {
    const path = require('path');
    const fs = require('fs');

    // Проверяем наличие Docker файлов
    const dockerFiles = ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'];

    return dockerFiles.some(file => fs.existsSync(path.join(context.projectPath, file)));
  }
}
