"use strict";
/**
 * Утилиты для работы с файловой системой и анализа проектов
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeUtils = exports.ColorUtils = exports.ExecutionUtils = exports.ProjectAnalyzer = exports.FileSystemUtils = void 0;
const child_process_1 = require("child_process");
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
class FileSystemUtils {
    /**
     * Проверяет существование файла
     */
    static async fileExists(filePath) {
        try {
            await fs_1.promises.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Проверяет существование директории
     */
    static async dirExists(dirPath) {
        try {
            const stats = await fs_1.promises.stat(dirPath);
            return stats.isDirectory();
        }
        catch {
            return false;
        }
    }
    /**
     * Читает и парсит JSON файл
     */
    static async readJsonFile(filePath) {
        try {
            const content = await fs_1.promises.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    /**
     * Читает текстовый файл
     */
    static async readTextFile(filePath) {
        try {
            return await fs_1.promises.readFile(filePath, 'utf-8');
        }
        catch {
            return null;
        }
    }
    /**
     * Поиск файлов по glob паттерну
     */
    static async findFiles(pattern, cwd) {
        try {
            return await (0, fast_glob_1.default)(pattern, { cwd, absolute: true });
        }
        catch {
            return [];
        }
    }
    /**
     * Получает список файлов в директории
     */
    static async listDirectory(dirPath) {
        try {
            return await fs_1.promises.readdir(dirPath);
        }
        catch {
            return [];
        }
    }
    /**
     * Получает размер файла
     */
    static async getFileSize(filePath) {
        try {
            const stats = await fs_1.promises.stat(filePath);
            return stats.size;
        }
        catch {
            return 0;
        }
    }
    /**
     * Подсчитывает строки кода в файле
     */
    static async countLinesInFile(filePath) {
        try {
            const content = await fs_1.promises.readFile(filePath, 'utf-8');
            return content.split('\n').length;
        }
        catch {
            return 0;
        }
    }
}
exports.FileSystemUtils = FileSystemUtils;
class ProjectAnalyzer {
    /**
     * Анализирует основную информацию о проекте
     */
    static async analyzeProject(projectPath) {
        const packageJsonPath = path.join(projectPath, 'package.json');
        const packageJson = await FileSystemUtils.readJsonFile(packageJsonPath);
        if (!packageJson) {
            throw new Error(`No package.json found in ${projectPath}`);
        }
        const framework = this.detectFramework(packageJson);
        const packageManager = await this.detectPackageManager(projectPath);
        const hasTypeScript = await this.hasTypeScript(projectPath);
        const hasTests = await this.hasTests(projectPath);
        const hasDocker = await this.hasDocker(projectPath);
        const hasCICD = await this.hasCICD(projectPath);
        const dependencies = this.analyzeDependencies(packageJson);
        const linesOfCode = await this.countLinesOfCode(projectPath);
        return {
            name: packageJson.name || path.basename(projectPath),
            version: packageJson.version || '0.0.0',
            description: packageJson.description,
            framework,
            packageManager,
            hasTypeScript,
            hasTests,
            hasDocker,
            hasCICD,
            linesOfCode,
            dependencies,
        };
    }
    /**
     * Определяет используемый фреймворк
     */
    static detectFramework(packageJson) {
        const frameworks = {
            '@sveltejs/kit': 'SvelteKit',
            svelte: 'Svelte',
            next: 'Next.js',
            nuxt: 'Nuxt.js',
            react: 'React',
            vue: 'Vue.js',
            '@angular/core': 'Angular',
            express: 'Express.js',
            fastify: 'Fastify',
            nest: 'NestJS',
        };
        const allDeps = {
            ...(packageJson.dependencies || {}),
            ...(packageJson.devDependencies || {}),
        };
        for (const [dep, name] of Object.entries(frameworks)) {
            if (allDeps[dep]) {
                return name;
            }
        }
        return undefined;
    }
    /**
     * Определяет используемый пакетный менеджер
     */
    static async detectPackageManager(projectPath) {
        if (await FileSystemUtils.fileExists(path.join(projectPath, 'pnpm-lock.yaml'))) {
            return 'pnpm';
        }
        if (await FileSystemUtils.fileExists(path.join(projectPath, 'yarn.lock'))) {
            return 'yarn';
        }
        return 'npm';
    }
    /**
     * Проверяет наличие TypeScript
     */
    static async hasTypeScript(projectPath) {
        return await FileSystemUtils.fileExists(path.join(projectPath, 'tsconfig.json'));
    }
    /**
     * Проверяет наличие тестов
     */
    static async hasTests(projectPath) {
        const testDirs = ['tests', 'test', '__tests__', 'spec'];
        for (const dir of testDirs) {
            if (await FileSystemUtils.dirExists(path.join(projectPath, dir))) {
                return true;
            }
        }
        // Проверяем наличие тестовых файлов
        const testFiles = await FileSystemUtils.findFiles('**/*.{test,spec}.{js,ts,jsx,tsx}', projectPath);
        return testFiles.length > 0;
    }
    /**
     * Проверяет наличие Docker
     */
    static async hasDocker(projectPath) {
        return await FileSystemUtils.fileExists(path.join(projectPath, 'Dockerfile'));
    }
    /**
     * Проверяет наличие CI/CD
     */
    static async hasCICD(projectPath) {
        const ciPaths = [
            '.github/workflows',
            '.gitlab-ci.yml',
            '.travis.yml',
            'circle.yml',
            '.circleci/config.yml',
        ];
        for (const ciPath of ciPaths) {
            const fullPath = path.join(projectPath, ciPath);
            if ((await FileSystemUtils.fileExists(fullPath)) ||
                (await FileSystemUtils.dirExists(fullPath))) {
                return true;
            }
        }
        return false;
    }
    /**
     * Анализирует зависимости
     */
    static analyzeDependencies(packageJson) {
        const production = Object.keys(packageJson.dependencies || {}).length;
        const development = Object.keys(packageJson.devDependencies || {}).length;
        return {
            production,
            development,
            total: production + development,
        };
    }
    /**
     * Подсчитывает строки кода
     */
    static async countLinesOfCode(projectPath) {
        try {
            const patterns = [
                'src/**/*.{js,ts,jsx,tsx,vue,svelte}',
                'lib/**/*.{js,ts,jsx,tsx,vue,svelte}',
                'components/**/*.{js,ts,jsx,tsx,vue,svelte}',
                '*.{js,ts,jsx,tsx,vue,svelte}',
            ];
            let totalLines = 0;
            for (const pattern of patterns) {
                const files = await FileSystemUtils.findFiles(pattern, projectPath);
                for (const file of files) {
                    totalLines += await FileSystemUtils.countLinesInFile(file);
                }
            }
            return totalLines;
        }
        catch {
            return 0;
        }
    }
}
exports.ProjectAnalyzer = ProjectAnalyzer;
class ExecutionUtils {
    /**
     * Выполняет команду и возвращает результат
     */
    static async executeCommand(command, cwd, timeout = 30000) {
        try {
            const output = (0, child_process_1.execSync)(command, {
                cwd,
                encoding: 'utf-8',
                timeout,
                stdio: 'pipe',
            });
            return {
                success: true,
                output: output.toString(),
            };
        }
        catch (error) {
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Проверяет доступность команды
     */
    static async isCommandAvailable(command) {
        try {
            const cmd = process.platform === 'win32' ? 'where' : 'which';
            (0, child_process_1.execSync)(`${cmd} ${command}`, { stdio: 'ignore' });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Получает версию пакета npm
     */
    static async getNpmPackageVersion(packageName, cwd) {
        try {
            const result = await this.executeCommand(`npm list ${packageName} --depth=0 --json`, cwd);
            if (result.success) {
                const parsed = JSON.parse(result.output);
                return parsed.dependencies?.[packageName]?.version || null;
            }
        }
        catch {
            // Fallback to package.json
            const packageJsonPath = path.join(cwd, 'package.json');
            const packageJson = await FileSystemUtils.readJsonFile(packageJsonPath);
            if (packageJson) {
                const allDeps = {
                    ...(packageJson.dependencies || {}),
                    ...(packageJson.devDependencies || {}),
                };
                return allDeps[packageName] || null;
            }
        }
        return null;
    }
}
exports.ExecutionUtils = ExecutionUtils;
class ColorUtils {
    static colors = {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        dim: '\x1b[2m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        gray: '\x1b[90m',
    };
    static colorize(text, color) {
        return `${this.colors[color]}${text}${this.colors.reset}`;
    }
    static success(text) {
        return this.colorize(text, 'green');
    }
    static error(text) {
        return this.colorize(text, 'red');
    }
    static warning(text) {
        return this.colorize(text, 'yellow');
    }
    static info(text) {
        return this.colorize(text, 'blue');
    }
    static highlight(text) {
        return this.colorize(text, 'cyan');
    }
    static dim(text) {
        return this.colorize(text, 'gray');
    }
    static bold(text) {
        return this.colorize(text, 'bright');
    }
}
exports.ColorUtils = ColorUtils;
class GradeUtils {
    /**
     * Вычисляет оценку на основе процента
     */
    static calculateGrade(percentage) {
        if (percentage >= 95)
            return 'A+';
        if (percentage >= 90)
            return 'A';
        if (percentage >= 85)
            return 'A-';
        if (percentage >= 80)
            return 'B+';
        if (percentage >= 75)
            return 'B';
        if (percentage >= 70)
            return 'B-';
        if (percentage >= 65)
            return 'C+';
        if (percentage >= 60)
            return 'C';
        if (percentage >= 55)
            return 'C-';
        if (percentage >= 50)
            return 'D+';
        if (percentage >= 45)
            return 'D';
        if (percentage >= 40)
            return 'D-';
        return 'F';
    }
    /**
     * Создает прогресс-бар
     */
    static createProgressBar(percentage, width = 20) {
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;
        const getColor = (p) => {
            if (p >= 90)
                return ColorUtils.colors.green;
            if (p >= 70)
                return ColorUtils.colors.yellow;
            if (p >= 50)
                return ColorUtils.colors.magenta;
            return ColorUtils.colors.red;
        };
        const color = getColor(percentage);
        const reset = ColorUtils.colors.reset;
        const gray = ColorUtils.colors.gray;
        return `${gray}[${color}${'█'.repeat(filled)}${gray}${'░'.repeat(empty)}]${reset}`;
    }
    /**
     * Получает цвет для процента
     */
    static getPercentageColor(percentage) {
        if (percentage >= 90)
            return 'green';
        if (percentage >= 70)
            return 'yellow';
        if (percentage >= 50)
            return 'magenta';
        return 'red';
    }
}
exports.GradeUtils = GradeUtils;
//# sourceMappingURL=index.js.map