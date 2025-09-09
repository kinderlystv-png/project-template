"use strict";
/**
 * Code Quality System Checker
 * Проверки системы обеспечения качества кода
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeQualityChecker = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class CodeQualityChecker {
    context;
    constructor(context) {
        this.context = context;
    }
    async checkAll() {
        const checks = [
            this.checkESLintConfig(),
            this.checkPrettierConfig(),
            this.checkTypeScriptConfig(),
            this.checkCommitLintConfig(),
            this.checkEditorConfig(),
            this.checkLintingScripts(),
            this.checkFormattingScripts(),
            this.checkPreCommitHooks(),
            this.checkCodeStyleConsistency(),
        ];
        return Promise.all(checks);
    }
    async checkESLintConfig() {
        const configFiles = [
            '.eslintrc.js',
            '.eslintrc.cjs',
            '.eslintrc.json',
            '.eslintrc.yml',
            '.eslintrc.yaml',
            'eslint.config.js',
            'eslint.config.mjs',
            'eslint.config.cjs',
        ];
        let passed = false;
        let configFile = '';
        for (const file of configFiles) {
            if ((0, fs_1.existsSync)((0, path_1.join)(this.context.projectPath, file))) {
                passed = true;
                configFile = file;
                break;
            }
        }
        let details = '';
        if (passed) {
            try {
                const content = (0, fs_1.readFileSync)((0, path_1.join)(this.context.projectPath, configFile), 'utf-8');
                details = `ESLint конфигурация: ${configFile}`;
                // Проверим основные настройки
                const hasSvelte = content.includes('@typescript-eslint') || content.includes('eslint-plugin-svelte');
                const hasStrict = content.includes('"strict"') || content.includes('"recommended"');
                const hasTypeScript = content.includes('@typescript-eslint');
                if (hasSvelte)
                    details += '. Svelte правила настроены';
                if (hasTypeScript)
                    details += '. TypeScript правила настроены';
                if (hasStrict)
                    details += '. Строгие правила активны';
                if (!hasSvelte && !hasTypeScript) {
                    details += '. Предупреждение: специфичные правила не настроены';
                }
            }
            catch (error) {
                details = `Ошибка чтения ${configFile}: ${error}`;
            }
        }
        else {
            details = 'ESLint конфигурация не найдена';
        }
        return {
            check: {
                id: 'eslint-config',
                name: 'ESLint Configuration',
                description: 'Проверка конфигурации ESLint для линтинга кода',
                category: 'code-quality',
                score: 20,
                critical: true,
                level: 'critical',
                tags: ['eslint', 'linting', 'code-quality'],
            },
            passed,
            score: passed ? 20 : 0,
            maxScore: 20,
            details,
            recommendations: passed
                ? []
                : [
                    'Создайте .eslintrc.cjs с базовой конфигурацией',
                    'Добавьте @typescript-eslint/recommended',
                    'Настройте eslint-plugin-svelte для Svelte файлов',
                    'Включите строгие правила для лучшего качества кода',
                ],
        };
    }
    async checkPrettierConfig() {
        const configFiles = [
            '.prettierrc',
            '.prettierrc.json',
            '.prettierrc.js',
            '.prettierrc.cjs',
            '.prettierrc.yml',
            '.prettierrc.yaml',
            'prettier.config.js',
            'prettier.config.cjs',
        ];
        let passed = false;
        let configFile = '';
        for (const file of configFiles) {
            if ((0, fs_1.existsSync)((0, path_1.join)(this.context.projectPath, configFile))) {
                passed = true;
                configFile = file;
                break;
            }
        }
        // Проверим также package.json
        const packagePath = (0, path_1.join)(this.context.projectPath, 'package.json');
        if (!passed && (0, fs_1.existsSync)(packagePath)) {
            try {
                const pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
                if (pkg.prettier) {
                    passed = true;
                    configFile = 'package.json (prettier field)';
                }
            }
            catch (error) {
                // Игнорируем ошибки
            }
        }
        let details = '';
        if (passed) {
            details = `Prettier конфигурация: ${configFile}`;
            // Проверим .prettierignore
            const ignorePath = (0, path_1.join)(this.context.projectPath, '.prettierignore');
            if ((0, fs_1.existsSync)(ignorePath)) {
                details += '. .prettierignore найден';
            }
            else {
                details += '. Предупреждение: .prettierignore отсутствует';
            }
        }
        else {
            details = 'Prettier конфигурация не найдена';
        }
        return {
            check: {
                id: 'prettier-config',
                name: 'Prettier Configuration',
                description: 'Проверка конфигурации Prettier для форматирования кода',
                category: 'code-quality',
                score: 15,
                critical: false,
                level: 'high',
                tags: ['prettier', 'formatting', 'code-style'],
            },
            passed,
            score: passed ? 15 : 0,
            maxScore: 15,
            details,
            recommendations: passed
                ? []
                : [
                    'Создайте .prettierrc с настройками форматирования',
                    'Добавьте .prettierignore для исключения файлов',
                    'Настройте интеграцию с ESLint через eslint-config-prettier',
                    'Установите единые правила форматирования для команды',
                ],
        };
    }
    async checkTypeScriptConfig() {
        const tsconfigPath = (0, path_1.join)(this.context.projectPath, 'tsconfig.json');
        const passed = (0, fs_1.existsSync)(tsconfigPath);
        let details = '';
        if (passed) {
            try {
                const content = (0, fs_1.readFileSync)(tsconfigPath, 'utf-8');
                const config = JSON.parse(content);
                details = 'TypeScript конфигурация найдена';
                // Проверим строгие настройки
                const compilerOptions = config.compilerOptions || {};
                const isStrict = compilerOptions.strict === true;
                if (isStrict) {
                    details += '. Строгий режим включен';
                }
                else {
                    details += '. Предупреждение: строгий режим отключен';
                }
                // Проверим модульную систему
                const moduleResolution = compilerOptions.moduleResolution;
                const target = compilerOptions.target;
                if (moduleResolution === 'bundler' || moduleResolution === 'node') {
                    details += `. Модульная система: ${moduleResolution}`;
                }
                if (target && (target.includes('ES2022') || target.includes('ESNext'))) {
                    details += `. Современная цель компиляции: ${target}`;
                }
            }
            catch (error) {
                details = `Ошибка чтения tsconfig.json: ${error}`;
            }
        }
        else {
            details = 'tsconfig.json не найден';
        }
        return {
            check: {
                id: 'typescript-config',
                name: 'TypeScript Configuration',
                description: 'Проверка конфигурации TypeScript для строгой типизации',
                category: 'code-quality',
                score: 18,
                critical: true,
                level: 'critical',
                tags: ['typescript', 'type-checking', 'strict-mode'],
            },
            passed,
            score: passed ? 18 : 0,
            maxScore: 18,
            details,
            recommendations: passed
                ? []
                : [
                    'Создайте tsconfig.json с базовой конфигурацией',
                    'Включите strict режим для строгой типизации',
                    'Настройте современную цель компиляции (ES2022+)',
                    'Добавьте path mapping для удобных импортов',
                ],
        };
    }
    async checkCommitLintConfig() {
        const configFiles = [
            'commitlint.config.js',
            'commitlint.config.cjs',
            'commitlint.config.ts',
            '.commitlintrc.js',
            '.commitlintrc.cjs',
            '.commitlintrc.json',
        ];
        let passed = false;
        let configFile = '';
        for (const file of configFiles) {
            if ((0, fs_1.existsSync)((0, path_1.join)(this.context.projectPath, file))) {
                passed = true;
                configFile = file;
                break;
            }
        }
        let details = '';
        if (passed) {
            try {
                const content = (0, fs_1.readFileSync)((0, path_1.join)(this.context.projectPath, configFile), 'utf-8');
                details = `CommitLint конфигурация: ${configFile}`;
                // Проверим тип конфигурации
                const hasConventional = content.includes('@commitlint/config-conventional');
                const hasCustomRules = content.includes('rules:');
                if (hasConventional) {
                    details += '. Conventional Commits стандарт';
                }
                if (hasCustomRules) {
                    details += '. Кастомные правила настроены';
                }
                if (!hasConventional && !hasCustomRules) {
                    details += '. Предупреждение: правила не настроены';
                }
            }
            catch (error) {
                details = `Ошибка чтения ${configFile}: ${error}`;
            }
        }
        else {
            details = 'CommitLint конфигурация не найдена';
        }
        return {
            check: {
                id: 'commitlint-config',
                name: 'CommitLint Configuration',
                description: 'Проверка конфигурации CommitLint для качественных коммитов',
                category: 'code-quality',
                score: 8,
                critical: false,
                level: 'medium',
                tags: ['commitlint', 'git', 'commit-quality'],
            },
            passed,
            score: passed ? 8 : 0,
            maxScore: 8,
            details,
            recommendations: passed
                ? []
                : [
                    'Создайте commitlint.config.cjs',
                    'Используйте @commitlint/config-conventional',
                    'Настройте git hooks для проверки коммитов',
                    'Обучите команду Conventional Commits стандарту',
                ],
        };
    }
    async checkEditorConfig() {
        const editorConfigPath = (0, path_1.join)(this.context.projectPath, '.editorconfig');
        const passed = (0, fs_1.existsSync)(editorConfigPath);
        let details = '';
        if (passed) {
            try {
                const content = (0, fs_1.readFileSync)(editorConfigPath, 'utf-8');
                details = '.editorconfig найден';
                // Проверим основные настройки
                const hasRoot = content.includes('root = true');
                const hasIndent = content.includes('indent_');
                const hasCharset = content.includes('charset');
                const hasEndOfLine = content.includes('end_of_line');
                let configCount = 0;
                if (hasRoot)
                    configCount++;
                if (hasIndent)
                    configCount++;
                if (hasCharset)
                    configCount++;
                if (hasEndOfLine)
                    configCount++;
                details += `. Настроек: ${configCount}/4`;
                if (configCount >= 3) {
                    details += '. Хорошая конфигурация';
                }
                else {
                    details += '. Предупреждение: базовые настройки отсутствуют';
                }
            }
            catch (error) {
                details = `Ошибка чтения .editorconfig: ${error}`;
            }
        }
        else {
            details = '.editorconfig не найден';
        }
        return {
            check: {
                id: 'editor-config',
                name: 'EditorConfig',
                description: 'Проверка .editorconfig для единообразия форматирования',
                category: 'code-quality',
                score: 5,
                critical: false,
                level: 'low',
                tags: ['editorconfig', 'formatting', 'consistency'],
            },
            passed,
            score: passed ? 5 : 0,
            maxScore: 5,
            details,
            recommendations: passed
                ? []
                : [
                    'Создайте .editorconfig с базовыми настройками',
                    'Настройте отступы, кодировку и окончания строк',
                    'Добавьте специфичные настройки для разных типов файлов',
                    'Убедитесь что редакторы команды поддерживают EditorConfig',
                ],
        };
    }
    async checkLintingScripts() {
        const packagePath = (0, path_1.join)(this.context.projectPath, 'package.json');
        let passed = false;
        let details = '';
        if ((0, fs_1.existsSync)(packagePath)) {
            try {
                const pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
                const scripts = pkg.scripts || {};
                // Проверим наличие lint скриптов
                const hasLint = scripts.lint;
                const hasLintFix = scripts['lint:fix'] || scripts.lintfix;
                const hasTypeCheck = scripts['type-check'] || scripts.typecheck;
                if (hasLint || hasLintFix || hasTypeCheck) {
                    passed = true;
                    details = 'Скрипты линтинга найдены';
                    if (hasLint)
                        details += '. lint';
                    if (hasLintFix)
                        details += '. lint:fix';
                    if (hasTypeCheck)
                        details += '. type-check';
                    // Проверим содержимое скриптов
                    if (hasLint && scripts.lint) {
                        const lintScript = scripts.lint;
                        if (lintScript.includes('eslint')) {
                            details += '. ESLint настроен';
                        }
                        if (lintScript.includes('--ext')) {
                            details += '. Расширения файлов указаны';
                        }
                    }
                }
                else {
                    details = 'Скрипты линтинга не найдены';
                }
            }
            catch (error) {
                details = `Ошибка чтения package.json: ${error}`;
            }
        }
        else {
            details = 'package.json не найден';
        }
        return {
            check: {
                id: 'linting-scripts',
                name: 'Linting Scripts',
                description: 'Проверка npm скриптов для линтинга кода',
                category: 'code-quality',
                score: 10,
                critical: false,
                level: 'high',
                tags: ['npm-scripts', 'linting', 'automation'],
            },
            passed,
            score: passed ? 10 : 0,
            maxScore: 10,
            details,
            recommendations: passed
                ? []
                : [
                    'Добавьте скрипт "lint" для проверки кода',
                    'Создайте скрипт "lint:fix" для автоматического исправления',
                    'Добавьте скрипт "type-check" для проверки типов',
                    'Настройте скрипты для разных типов файлов (.ts, .svelte)',
                ],
        };
    }
    async checkFormattingScripts() {
        const packagePath = (0, path_1.join)(this.context.projectPath, 'package.json');
        let passed = false;
        let details = '';
        if ((0, fs_1.existsSync)(packagePath)) {
            try {
                const pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
                const scripts = pkg.scripts || {};
                // Проверим наличие format скриптов
                const hasFormat = scripts.format;
                const hasFormatCheck = scripts['format:check'] || scripts.formatcheck;
                if (hasFormat || hasFormatCheck) {
                    passed = true;
                    details = 'Скрипты форматирования найдены';
                    if (hasFormat)
                        details += '. format';
                    if (hasFormatCheck)
                        details += '. format:check';
                    // Проверим содержимое скриптов
                    if (hasFormat && scripts.format) {
                        const formatScript = scripts.format;
                        if (formatScript.includes('prettier')) {
                            details += '. Prettier настроен';
                        }
                        if (formatScript.includes('--write')) {
                            details += '. Автоматическое исправление включено';
                        }
                    }
                }
                else {
                    details = 'Скрипты форматирования не найдены';
                }
            }
            catch (error) {
                details = `Ошибка чтения package.json: ${error}`;
            }
        }
        else {
            details = 'package.json не найден';
        }
        return {
            check: {
                id: 'formatting-scripts',
                name: 'Formatting Scripts',
                description: 'Проверка npm скриптов для форматирования кода',
                category: 'code-quality',
                score: 8,
                critical: false,
                level: 'medium',
                tags: ['npm-scripts', 'formatting', 'prettier'],
            },
            passed,
            score: passed ? 8 : 0,
            maxScore: 8,
            details,
            recommendations: passed
                ? []
                : [
                    'Добавьте скрипт "format" для форматирования кода',
                    'Создайте скрипт "format:check" для проверки форматирования',
                    'Настройте Prettier для автоматического форматирования',
                    'Интегрируйте форматирование в CI/CD pipeline',
                ],
        };
    }
    async checkPreCommitHooks() {
        const huskyPath = (0, path_1.join)(this.context.projectPath, '.husky');
        const packagePath = (0, path_1.join)(this.context.projectPath, 'package.json');
        let passed = false;
        let details = '';
        // Проверим Husky hooks
        if ((0, fs_1.existsSync)(huskyPath)) {
            const preCommitPath = (0, path_1.join)(huskyPath, 'pre-commit');
            if ((0, fs_1.existsSync)(preCommitPath)) {
                passed = true;
                details = 'Pre-commit hooks настроены (Husky)';
                try {
                    const content = (0, fs_1.readFileSync)(preCommitPath, 'utf-8');
                    if (content.includes('lint-staged')) {
                        details += '. lint-staged интегрирован';
                    }
                    if (content.includes('lint') || content.includes('format')) {
                        details += '. Проверки качества кода включены';
                    }
                }
                catch (error) {
                    details += `. Ошибка чтения hook: ${error}`;
                }
            }
        }
        // Проверим lint-staged в package.json
        if ((0, fs_1.existsSync)(packagePath)) {
            try {
                const pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
                const hasLintStaged = pkg['lint-staged'] || pkg.devDependencies?.['lint-staged'];
                if (hasLintStaged) {
                    if (!passed) {
                        passed = true;
                        details = 'lint-staged настроен';
                    }
                    else {
                        details += '. Конфигурация lint-staged найдена';
                    }
                    // Проверим конфигурацию lint-staged
                    if (pkg['lint-staged']) {
                        const config = pkg['lint-staged'];
                        const hasTypeScript = config['*.ts'] || config['*.{ts,tsx}'];
                        const hasSvelte = config['*.svelte'];
                        const hasJSON = config['*.json'];
                        let configuredTypes = 0;
                        if (hasTypeScript)
                            configuredTypes++;
                        if (hasSvelte)
                            configuredTypes++;
                        if (hasJSON)
                            configuredTypes++;
                        details += `. Типы файлов: ${configuredTypes}`;
                    }
                }
            }
            catch (error) {
                // Игнорируем ошибки
            }
        }
        if (!passed) {
            details = 'Pre-commit hooks не настроены';
        }
        return {
            check: {
                id: 'pre-commit-hooks',
                name: 'Pre-commit Hooks',
                description: 'Проверка настройки pre-commit hooks для качества кода',
                category: 'code-quality',
                score: 12,
                critical: false,
                level: 'high',
                tags: ['git-hooks', 'pre-commit', 'automation'],
            },
            passed,
            score: passed ? 12 : 0,
            maxScore: 12,
            details,
            recommendations: passed
                ? []
                : [
                    'Установите husky для git hooks',
                    'Создайте pre-commit hook для автоматических проверок',
                    'Настройте lint-staged для проверки только измененных файлов',
                    'Добавьте проверки форматирования и линтинга',
                ],
        };
    }
    async checkCodeStyleConsistency() {
        const files = ['.eslintrc.cjs', '.prettierrc', '.editorconfig', 'tsconfig.json'];
        let configCount = 0;
        const foundConfigs = [];
        for (const file of files) {
            if ((0, fs_1.existsSync)((0, path_1.join)(this.context.projectPath, file))) {
                configCount++;
                foundConfigs.push(file);
            }
        }
        const passed = configCount >= 3; // Минимум 3 из 4 конфигураций
        let details = '';
        if (passed) {
            details = `Конфигурации найдены: ${configCount}/4`;
            details += ` (${foundConfigs.join(', ')})`;
            if (configCount === 4) {
                details += '. Полная настройка качества кода';
            }
            else {
                details += '. Хорошая настройка, можно улучшить';
            }
        }
        else {
            details = `Недостаточно конфигураций: ${configCount}/4`;
            if (foundConfigs.length > 0) {
                details += ` (найдены: ${foundConfigs.join(', ')})`;
            }
        }
        return {
            check: {
                id: 'code-style-consistency',
                name: 'Code Style Consistency',
                description: 'Проверка последовательности настройки стиля кода',
                category: 'code-quality',
                score: 10,
                critical: false,
                level: 'medium',
                tags: ['consistency', 'code-style', 'configuration'],
            },
            passed,
            score: passed ? 10 : 0,
            maxScore: 10,
            details,
            recommendations: passed
                ? []
                : [
                    'Убедитесь что все конфигурации согласованы',
                    'Добавьте отсутствующие конфигурационные файлы',
                    'Настройте интеграцию между ESLint и Prettier',
                    'Документируйте стандарты кодирования для команды',
                ],
        };
    }
}
exports.CodeQualityChecker = CodeQualityChecker;
//# sourceMappingURL=code-quality.js.map