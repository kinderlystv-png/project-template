# ⚡ ЭАП - Запуск за 2 минуты

## 📋 Что это?

**ЭАП** - анализатор проектов, который проверяет качество кода и соответствие стандартам.

## 🚀 Быстрый запуск

### 1️⃣ Скачать (30 сек)

```bash
git clone https://github.com/kinderlystv-png/project-template.git
cd project-template/eap-analyzer
```

### 2️⃣ Установить (1 мин)

```bash
pnpm install
```

### 3️⃣ Запустить (10 сек)

```bash
# Анализ любого проекта
node bin/eap.js analyze /path/to/your/project

# Пример: анализ текущей папки
node bin/eap.js analyze .

# Пример: анализ родительской папки
node bin/eap.js analyze ../
```

## 📊 Что получите?

```
🎯 Общая оценка: A (93/100)
✅ Пройдено: 67/71 проверок
⚡ Критических проблем: 0
⏱️ Время: 0.07с

📋 КОМПОНЕНТЫ:
A EMT (100%) ✅ 10/10
A Docker (100%) ✅ 10/10
A SvelteKit (100%) ✅ 10/10
A CI/CD (100%) ✅ 8/8
A Code Quality (100%) ✅ 9/9
B Vitest (90%) ✅ 8/9
B Dependencies (85%) ✅ 8/9
D Logging (60%) ✅ 4/6

💡 РЕКОМЕНДАЦИИ:
1. Добавьте Vitest в CI
2. Настройте автоаудит безопасности
3. Улучшите систему логирования
```

## 🎯 Готово

- 🔍 **Анализ проекта**: `node bin/eap.js analyze /path`
- ❓ **Справка**: `node bin/eap.js --help`
- 📖 **Стандарт**: `node bin/eap.js standard`

---

📚 [Полная документация](README.md) | 📦 [Структура](PACKAGING.md)
