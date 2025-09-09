# 📋 EAP Analyzer v3.0 - Простая инструкция

## 🎯 Как запустить на другом проекте

### Шаг 1: Скопируйте анализатор
```bash
# Скопируйте всю папку eap-analyzer в ваш целевой проект
cp -r eap-analyzer /path/to/your/project/
```

### Шаг 2: Установите зависимости
```bash
cd /path/to/your/project/eap-analyzer
npm install
```

### Шаг 3: Запустите анализ
```bash
# Анализ родительского проекта (рекомендуется)
npm run quick-analyze

# Или анализ конкретной папки
node bin/quick-analyze.cjs /path/to/analyze
```

## ✅ Готово!

Вы получите:
- 📊 Статистику проекта
- 🎯 Найденные проблемы
- 💡 Рекомендации по улучшению
- 💰 ROI анализ инвестиций
- 📄 JSON отчет: `eap-analysis-latest.json`

## 🔧 Если что-то не работает

1. Проверьте Node.js версию 18+
2. Запустите `npm install` в папке eap-analyzer
3. Используйте `node bin/quick-analyze.cjs .` для тестирования

---
**Ultimate EAP Analyzer v3.0** готов к работе! 🚀
