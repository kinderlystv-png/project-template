/**
 * Docker Optimization Checker - проверяет оптимизацию Docker образов и конфигураций
 */

import { BaseChecker } from '../../../core/checker.js';
import { CheckContext, CheckResult } from '../../../core/types.js';

export class DockerOptimizationChecker extends BaseChecker {
  readonly name = 'Docker Optimization Checker';
  readonly category = 'performance' as const;
  readonly description = 'Проверяет оптимизацию Docker образов и производительность';

  async check(context: CheckContext): Promise<CheckResult> {
    const path = require('path');
    const fs = require('fs');

    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      let score = 100;

      // Проверка Dockerfile на оптимизацию
      const dockerfilePath = path.join(context.projectPath, 'Dockerfile');

      if (fs.existsSync(dockerfilePath)) {
        const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
        const lines = dockerfileContent
          .split('\n')
          .map((line: string) => line.trim())
          .filter(Boolean);

        // Проверка Multi-stage build
        const fromLines = lines.filter((line: string) => line.startsWith('FROM'));
        const hasMultiStage = fromLines.length > 1;

        if (!hasMultiStage && lines.length > 20) {
          warnings.push('Большой Dockerfile без multi-stage build');
          score -= 15;
          recommendations.push(
            'Рассмотрите использование multi-stage build для уменьшения размера образа'
          );
        }

        // Проверка количества слоев
        const runLines = lines.filter((line: string) => line.startsWith('RUN'));
        if (runLines.length > 5) {
          warnings.push(`Много RUN инструкций (${runLines.length}) - объедините команды`);
          score -= 10;
          recommendations.push(
            'Объедините RUN команды с помощью && для уменьшения количества слоев'
          );
        }

        // Проверка кэширования пакетных менеджеров
        const packageManagerPatterns = [
          { pattern: /apt-get update.*&&.*apt-get install/, manager: 'apt' },
          { pattern: /npm install/, manager: 'npm' },
          { pattern: /yarn install/, manager: 'yarn' },
          { pattern: /pip install/, manager: 'pip' },
        ];

        for (const { pattern, manager } of packageManagerPatterns) {
          const hasPattern = lines.some((line: string) => pattern.test(line));

          if (hasPattern) {
            // Проверка очистки кэша
            if (manager === 'apt') {
              const hasCleanup = lines.some(
                (line: string) =>
                  line.includes('apt-get clean') || line.includes('rm -rf /var/lib/apt/lists/*')
              );
              if (!hasCleanup) {
                warnings.push('apt-get без очистки кэша увеличивает размер образа');
                score -= 10;
                recommendations.push(
                  'Добавьте очистку кэша: && apt-get clean && rm -rf /var/lib/apt/lists/*'
                );
              }
            }

            if (manager === 'npm') {
              const hasCleanup = lines.some((line: string) => line.includes('npm cache clean'));
              if (!hasCleanup) {
                warnings.push('npm install без очистки кэша');
                score -= 5;
                recommendations.push('Очистите npm кэш: && npm cache clean --force');
              }
            }
          }
        }

        // Проверка COPY vs ADD
        const addLines = lines.filter((line: string) => line.startsWith('ADD'));
        const unnecessaryAdd = addLines.filter(
          (line: string) => !line.includes('http') && !line.includes('.tar')
        );

        if (unnecessaryAdd.length > 0) {
          warnings.push('Используйте COPY вместо ADD для простых файлов');
          score -= 5;
          recommendations.push(
            'ADD предназначен для архивов и URL, используйте COPY для обычных файлов'
          );
        }

        // Проверка базового образа
        const baseImages = fromLines.map((line: string) => line.split(' ')[1]);

        for (const image of baseImages) {
          if (image && image.includes(':latest')) {
            warnings.push('Использование :latest тега не рекомендуется');
            score -= 10;
            recommendations.push('Зафиксируйте конкретную версию базового образа');
          }

          // Проверка на минимальные образы
          if (
            image &&
            (image.includes('ubuntu') || image.includes('centos')) &&
            !image.includes('slim')
          ) {
            warnings.push(
              `Используется полный образ ${image} - рассмотрите alpine или slim варианты`
            );
            score -= 10;
            recommendations.push('Используйте alpine или slim образы для меньшего размера');
          }
        }

        // Проверка .dockerignore
        const dockerignorePath = path.join(context.projectPath, '.dockerignore');
        if (!fs.existsSync(dockerignorePath)) {
          warnings.push('Отсутствует .dockerignore файл');
          score -= 15;
          recommendations.push(
            'Создайте .dockerignore для исключения ненужных файлов из контекста сборки'
          );
        } else {
          const dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf-8');
          const ignoreLines = dockerignoreContent
            .split('\n')
            .map((line: string) => line.trim())
            .filter(Boolean);

          const importantIgnores = [
            'node_modules',
            '.git',
            '*.log',
            'coverage',
            '.nyc_output',
            'README.md',
            '.env',
          ];

          const missingIgnores = importantIgnores.filter(
            ignore => !ignoreLines.some((line: string) => line.includes(ignore))
          );

          if (missingIgnores.length > 0) {
            warnings.push(
              `В .dockerignore отсутствуют важные исключения: ${missingIgnores.join(', ')}`
            );
            score -= missingIgnores.length * 3;
            recommendations.push(`Добавьте в .dockerignore: ${missingIgnores.join(', ')}`);
          }
        }

        // Проверка WORKDIR
        const hasWorkdir = lines.some((line: string) => line.startsWith('WORKDIR'));
        if (!hasWorkdir) {
          warnings.push('Отсутствует WORKDIR инструкция');
          score -= 5;
          recommendations.push('Установите WORKDIR для организации файловой структуры');
        }

        // Проверка LABEL
        const hasLabels = lines.some((line: string) => line.startsWith('LABEL'));
        if (!hasLabels) {
          warnings.push('Отсутствуют LABEL метаданные');
          score -= 5;
          recommendations.push('Добавьте LABEL с информацией о версии, авторе и описании');
        }
      } else {
        // Если Dockerfile отсутствует
        return this.createResult(
          true,
          100,
          'No Dockerfile found - optimization check not applicable',
          { reason: 'No Docker configuration' }
        );
      }

      // Проверка docker-compose на оптимизацию
      const composeFiles = ['docker-compose.yml', 'docker-compose.yaml'];

      for (const composeFile of composeFiles) {
        const composePath = path.join(context.projectPath, composeFile);

        if (fs.existsSync(composePath)) {
          const composeContent = fs.readFileSync(composePath, 'utf-8');

          // Проверка restart policy
          if (!composeContent.includes('restart:')) {
            warnings.push('Отсутствует restart policy в docker-compose');
            score -= 5;
            recommendations.push(
              'Добавьте restart: unless-stopped для автоматического перезапуска'
            );
          }

          // Проверка networks
          if (!composeContent.includes('networks:')) {
            warnings.push('Не используются кастомные сети в docker-compose');
            score -= 5;
            recommendations.push('Создайте кастомные сети для лучшей изоляции сервисов');
          }

          // Проверка health checks
          if (!composeContent.includes('healthcheck:')) {
            warnings.push('Отсутствуют health checks в docker-compose');
            score -= 10;
            recommendations.push('Добавьте healthcheck для мониторинга состояния сервисов');
          }

          // Проверка resource limits
          if (!composeContent.includes('mem_limit') && !composeContent.includes('cpus:')) {
            warnings.push('Не установлены ограничения ресурсов');
            score -= 5;
            recommendations.push('Установите mem_limit и cpus для контроля ресурсов');
          }
        }
      }

      // Финальная оценка
      score = Math.max(0, score);
      const passed = score >= 70;

      return this.createResult(
        passed,
        score,
        `Docker optimization check ${passed ? 'passed' : 'failed'} (${score}/100)`,
        { issues, warnings },
        recommendations
      );
    } catch (error) {
      return this.createResult(false, 0, 'Docker optimization check failed', [
        `Ошибка проверки оптимизации Docker: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
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
