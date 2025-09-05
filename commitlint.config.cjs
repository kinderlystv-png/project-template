module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // Новая функциональность
        'fix', // Исправление ошибок
        'docs', // Документация
        'style', // Форматирование кода (не влияет на функциональность)
        'refactor', // Рефакторинг кода
        'perf', // Улучшения производительности
        'test', // Добавление или изменение тестов
        'chore', // Обслуживание кода (обновление зависимостей и т.д.)
        'ci', // Изменения в CI/CD конфигурации
        'build', // Изменения в системе сборки
        'revert', // Откат изменений
        'wip', // Work in progress (промежуточный коммит)
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [0], // Отключение проверки регистра в сообщении
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },
  prompt: {
    questions: {
      type: {
        description: 'Выберите тип изменения:',
        enum: {
          feat: {
            description: 'Новая функциональность',
            title: 'Features',
            emoji: '✨',
          },
          fix: {
            description: 'Исправление ошибки',
            title: 'Bug Fixes',
            emoji: '🐛',
          },
          docs: {
            description: 'Изменения в документации',
            title: 'Documentation',
            emoji: '📚',
          },
          style: {
            description: 'Изменения стилей (форматирование, отсутствующие точки с запятой и т.д.)',
            title: 'Styles',
            emoji: '💎',
          },
          refactor: {
            description: 'Рефакторинг кода (без изменения функциональности)',
            title: 'Code Refactoring',
            emoji: '📦',
          },
          perf: {
            description: 'Улучшение производительности',
            title: 'Performance Improvements',
            emoji: '🚀',
          },
          test: {
            description: 'Добавление или изменение тестов',
            title: 'Tests',
            emoji: '🚨',
          },
          chore: {
            description: 'Изменения в процессе сборки или вспомогательных инструментах',
            title: 'Chores',
            emoji: '♻️',
          },
          ci: {
            description: 'Изменения в CI конфигурации и скриптах',
            title: 'Continuous Integrations',
            emoji: '⚙️',
          },
          build: {
            description: 'Изменения, влияющие на систему сборки или внешние зависимости',
            title: 'Builds',
            emoji: '🛠',
          },
          revert: {
            description: 'Откат предыдущего коммита',
            title: 'Reverts',
            emoji: '🗑',
          },
        },
      },
      scope: {
        description: 'Какова область этого изменения (например, components, utils, docs):',
      },
      subject: {
        description: 'Напишите краткое описание изменения:',
      },
      body: {
        description: 'Предоставьте более подробное описание изменения (опционально):',
      },
      isBreaking: {
        description: 'Есть ли какие-либо критические изменения?',
      },
      breakingBody: {
        description:
          'Коммит с критическими изменениями требует тела. Пожалуйста, введите более длинное описание самого коммита:',
      },
      breaking: {
        description: 'Опишите критические изменения:',
      },
      isIssueAffected: {
        description: 'Влияет ли это изменение на какие-либо открытые задачи?',
      },
      issuesBody: {
        description:
          'Если проблемы закрыты, коммит требует тела. Пожалуйста, введите более длинное описание самого коммита:',
      },
      issues: {
        description: 'Добавьте ссылки на задачи (например, "fix #123", "re #123"):',
      },
    },
  },
};
