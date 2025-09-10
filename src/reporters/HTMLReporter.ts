/**
 * 📝 EAP ANALYZER v6.0 - HTML REPORTER
 * Генерация интерактивных HTML отчетов с разворачивающимися секциями
 */

import type { ReportData, ReportConfig, IReporter } from './types.js';

export class HTMLReporter implements IReporter {
  async generate(data: ReportData, config: ReportConfig): Promise<string> {
    const html = this.generateHTML(data, config);

    if (config.outputPath) {
      const fs = await import('fs/promises');
      const path = await import('path');

      const outputFile = path.join(config.outputPath, 'eap-analysis-report.html');
      await fs.writeFile(outputFile, html, 'utf8');

      return outputFile;
    }

    return html;
  }

  getDefaultConfig(): ReportConfig {
    return {
      format: 'html',
      includeDetails: true,
      includeRecommendations: true,
      theme: 'light',
      interactive: true,
      minifyOutput: false,
    };
  }

  getSupportedFormats(): string[] {
    return ['html'];
  }

  private generateHTML(data: ReportData, config: ReportConfig): string {
    const styles = this.generateStyles(config.theme || 'light');
    const scripts = this.generateScripts();
    const content = this.generateContent(data, config);

    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EAP Analyzer Report - ${data.projectPath}</title>
    ${styles}
</head>
<body>
    <div class="theme-toggle">
        <button onclick="toggleTheme()" title="Переключить тему">🌓</button>
    </div>
    <div class="search-panel">
        <input type="text" id="searchInput" placeholder="🔍 Поиск по отчету..." onkeyup="searchReport()">
        <div class="filters">
            <button onclick="filterByStatus('all')" class="filter-btn active">Все</button>
            <button onclick="filterByStatus('critical')" class="filter-btn">Критичные</button>
            <button onclick="filterByStatus('warning')" class="filter-btn">Предупреждения</button>
            <button onclick="filterByStatus('excellent')" class="filter-btn">Отличные</button>
        </div>
    </div>
    <div class="report-container">
        ${content}
    </div>
    ${scripts}
</body>
</html>`;
  }

  private generateStyles(theme: string): string {
    const isDark = theme === 'dark';

    return `<style>
        :root {
            --bg-primary: ${isDark ? '#1a1a1a' : '#ffffff'};
            --bg-secondary: ${isDark ? '#2d2d2d' : '#f8f9fa'};
            --bg-card: ${isDark ? '#333333' : '#ffffff'};
            --text-primary: ${isDark ? '#e0e0e0' : '#333333'};
            --text-secondary: ${isDark ? '#b0b0b0' : '#666666'};
            --border-color: ${isDark ? '#404040' : '#e1e5e9'};
            --success-color: #28a745;
            --warning-color: #ffc107;
            --danger-color: #dc3545;
            --info-color: #17a2b8;
            --shadow: ${isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'};
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
        }

        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: var(--bg-card);
            border-radius: 12px;
            box-shadow: var(--shadow);
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .header .subtitle {
            color: var(--text-secondary);
            font-size: 1.1rem;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .summary-card {
            background: var(--bg-card);
            padding: 25px;
            border-radius: 12px;
            box-shadow: var(--shadow);
            text-align: center;
            border-left: 4px solid var(--info-color);
        }

        .summary-card.excellent { border-left-color: var(--success-color); }
        .summary-card.good { border-left-color: var(--info-color); }
        .summary-card.warning { border-left-color: var(--warning-color); }
        .summary-card.critical { border-left-color: var(--danger-color); }

        .summary-card .value {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .summary-card .label {
            color: var(--text-secondary);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .readiness-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: bold;
            margin: 0 auto 15px;
            position: relative;
        }

        .readiness-circle.excellent { background: conic-gradient(var(--success-color) 0% var(--readiness-percent), var(--bg-secondary) var(--readiness-percent) 100%); }
        .readiness-circle.good { background: conic-gradient(var(--info-color) 0% var(--readiness-percent), var(--bg-secondary) var(--readiness-percent) 100%); }
        .readiness-circle.warning { background: conic-gradient(var(--warning-color) 0% var(--readiness-percent), var(--bg-secondary) var(--readiness-percent) 100%); }
        .readiness-circle.critical { background: conic-gradient(var(--danger-color) 0% var(--readiness-percent), var(--bg-secondary) var(--readiness-percent) 100%); }

        .readiness-circle::before {
            content: '';
            position: absolute;
            width: 90px;
            height: 90px;
            background: var(--bg-card);
            border-radius: 50%;
        }

        .readiness-circle span {
            position: relative;
            z-index: 1;
        }

        .categories {
            display: grid;
            gap: 30px;
        }

        .category-card {
            background: var(--bg-card);
            border-radius: 12px;
            box-shadow: var(--shadow);
            overflow: hidden;
        }

        .category-header {
            padding: 25px;
            background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-card) 100%);
            cursor: pointer;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.3s ease;
        }

        .category-header:hover {
            background: var(--bg-secondary);
        }

        .category-header.active {
            background: var(--info-color);
            color: white;
        }

        .category-title {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .category-icon {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            background: var(--info-color);
            color: white;
        }

        .category-info h3 {
            font-size: 1.4rem;
            margin-bottom: 5px;
        }

        .category-info p {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .category-header.active .category-info p {
            color: rgba(255, 255, 255, 0.8);
        }

        .category-status {
            text-align: right;
        }

        .readiness-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9rem;
            margin-bottom: 5px;
        }

        .readiness-badge.excellent { background: var(--success-color); color: white; }
        .readiness-badge.good { background: var(--info-color); color: white; }
        .readiness-badge.warning { background: var(--warning-color); color: #333; }
        .readiness-badge.critical { background: var(--danger-color); color: white; }

        .expand-icon {
            font-size: 1.5rem;
            transition: transform 0.3s ease;
        }

        .category-header.active .expand-icon {
            transform: rotate(180deg);
        }

        .category-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }

        .category-content.expanded {
            max-height: 2000px;
        }

        .components-grid {
            padding: 25px;
            display: grid;
            gap: 20px;
        }

        .component-card {
            background: var(--bg-secondary);
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid var(--info-color);
        }

        .component-card.excellent { border-left-color: var(--success-color); }
        .component-card.good { border-left-color: var(--info-color); }
        .component-card.warning { border-left-color: var(--warning-color); }
        .component-card.critical { border-left-color: var(--danger-color); }

        .component-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .component-name {
            font-size: 1.2rem;
            font-weight: bold;
        }

        .component-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .detail-item {
            text-align: center;
        }

        .detail-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--info-color);
        }

        .detail-label {
            font-size: 0.8rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .issues-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
        }

        .issues-list {
            max-height: 300px;
            overflow-y: auto;
        }

        .issue-item {
            padding: 10px;
            margin-bottom: 8px;
            border-radius: 6px;
            background: var(--bg-card);
            border-left: 3px solid var(--warning-color);
        }

        .issue-item.critical { border-left-color: var(--danger-color); }
        .issue-item.high { border-left-color: var(--warning-color); }
        .issue-item.medium { border-left-color: var(--info-color); }
        .issue-item.low { border-left-color: var(--success-color); }

        .recommendations-section {
            margin-top: 40px;
            padding: 30px;
            background: var(--bg-card);
            border-radius: 12px;
            box-shadow: var(--shadow);
        }

        .recommendations-grid {
            display: grid;
            gap: 20px;
            margin-top: 20px;
        }

        .recommendation-card {
            padding: 20px;
            background: var(--bg-secondary);
            border-radius: 8px;
            border-left: 4px solid var(--info-color);
        }

        .recommendation-card.critical { border-left-color: var(--danger-color); }
        .recommendation-card.high { border-left-color: var(--warning-color); }
        .recommendation-card.medium { border-left-color: var(--info-color); }
        .recommendation-card.low { border-left-color: var(--success-color); }

        .metadata {
            margin-top: 40px;
            padding: 20px;
            background: var(--bg-secondary);
            border-radius: 8px;
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            .report-container {
                padding: 10px;
            }

            .header h1 {
                font-size: 2rem;
            }

            .summary-grid {
                grid-template-columns: 1fr;
            }

            .category-header {
                padding: 20px;
            }

            .category-title {
                flex-direction: column;
                text-align: center;
                gap: 10px;
            }

            .component-header {
                flex-direction: column;
                text-align: center;
                gap: 10px;
            }
        }
    </style>`;
  }

  private generateScripts(): string {
    return `<script>
        // Глобальные переменные
        let currentTheme = 'light';
        let searchQuery = '';
        let activeFilter = 'all';

        // Инициализация интерактивности
        document.addEventListener('DOMContentLoaded', function() {
            // Обработчики для разворачивания категорий
            const categoryHeaders = document.querySelectorAll('.category-header');

            categoryHeaders.forEach(header => {
                header.addEventListener('click', function() {
                    const content = this.nextElementSibling;
                    const isExpanded = content.classList.contains('expanded');

                    // Закрываем все остальные категории
                    categoryHeaders.forEach(h => {
                        h.classList.remove('active');
                        h.nextElementSibling.classList.remove('expanded');
                    });

                    // Открываем текущую, если она была закрыта
                    if (!isExpanded) {
                        this.classList.add('active');
                        content.classList.add('expanded');
                    }
                });
            });

            // Автоматически открываем первую категорию
            if (categoryHeaders.length > 0) {
                categoryHeaders[0].click();
            }

            // Обновляем прогресс-круги
            updateProgressCircles();

            // Инициализируем тему из localStorage
            const savedTheme = localStorage.getItem('eap-theme') || 'light';
            if (savedTheme === 'dark') {
                toggleTheme();
            }
        });

        // Переключение темы
        function toggleTheme() {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.body.classList.toggle('dark-theme');

            // Обновляем CSS переменные
            if (currentTheme === 'dark') {
                document.documentElement.style.setProperty('--bg-primary', '#1a1a1a');
                document.documentElement.style.setProperty('--bg-secondary', '#2d2d2d');
                document.documentElement.style.setProperty('--bg-card', '#333333');
                document.documentElement.style.setProperty('--text-primary', '#e0e0e0');
                document.documentElement.style.setProperty('--text-secondary', '#b0b0b0');
                document.documentElement.style.setProperty('--border-color', '#404040');
                document.documentElement.style.setProperty('--shadow', '0 2px 8px rgba(0,0,0,0.3)');
            } else {
                document.documentElement.style.setProperty('--bg-primary', '#ffffff');
                document.documentElement.style.setProperty('--bg-secondary', '#f8f9fa');
                document.documentElement.style.setProperty('--bg-card', '#ffffff');
                document.documentElement.style.setProperty('--text-primary', '#333333');
                document.documentElement.style.setProperty('--text-secondary', '#666666');
                document.documentElement.style.setProperty('--border-color', '#e1e5e9');
                document.documentElement.style.setProperty('--shadow', '0 2px 8px rgba(0,0,0,0.1)');
            }

            // Сохраняем выбор темы
            localStorage.setItem('eap-theme', currentTheme);
        }

        // Поиск по отчету
        function searchReport() {
            const input = document.getElementById('searchInput');
            searchQuery = input.value.toLowerCase();

            // Очищаем предыдущие подсветки
            clearHighlights();

            if (searchQuery.length < 2) {
                filterContent();
                return;
            }

            // Подсвечиваем найденный текст
            highlightText(searchQuery);

            // Фильтруем контент
            filterContent();
        }

        // Очистка подсветки
        function clearHighlights() {
            const highlighted = document.querySelectorAll('.highlight');
            highlighted.forEach(el => {
                const parent = el.parentNode;
                parent.replaceChild(document.createTextNode(el.textContent), el);
                parent.normalize();
            });
        }

        // Подсветка текста
        function highlightText(query) {
            const walker = document.createTreeWalker(
                document.querySelector('.categories'),
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let node;
            const nodesToReplace = [];

            while (node = walker.nextNode()) {
                if (node.nodeValue.toLowerCase().includes(query)) {
                    nodesToReplace.push(node);
                }
            }

            nodesToReplace.forEach(node => {
                const text = node.nodeValue;
                const regex = new RegExp(\`(\${query})\`, 'gi');
                const highlightedText = text.replace(regex, '<span class="highlight">$1</span>');

                const wrapper = document.createElement('div');
                wrapper.innerHTML = highlightedText;

                while (wrapper.firstChild) {
                    node.parentNode.insertBefore(wrapper.firstChild, node);
                }
                node.parentNode.removeChild(node);
            });
        }

        // Фильтрация по статусу
        function filterByStatus(status) {
            activeFilter = status;

            // Обновляем активную кнопку
            const filterBtns = document.querySelectorAll('.filter-btn');
            filterBtns.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            filterContent();
        }

        // Основная функция фильтрации
        function filterContent() {
            const categories = document.querySelectorAll('.category-card');

            categories.forEach(category => {
                let shouldShow = false;

                // Проверяем статус
                if (activeFilter === 'all') {
                    shouldShow = true;
                } else {
                    const statusBadge = category.querySelector('.readiness-badge');
                    if (statusBadge && statusBadge.classList.contains(activeFilter)) {
                        shouldShow = true;
                    }
                }

                // Проверяем поиск
                if (shouldShow && searchQuery.length >= 2) {
                    const text = category.textContent.toLowerCase();
                    shouldShow = text.includes(searchQuery);
                }

                // Показываем/скрываем категорию
                if (shouldShow) {
                    category.classList.remove('hidden');
                    category.style.display = 'block';
                } else {
                    category.classList.add('hidden');
                    category.style.display = 'none';
                }
            });

            // Автоматически открываем первую видимую категорию
            const visibleCategories = document.querySelectorAll('.category-card:not(.hidden)');
            if (visibleCategories.length > 0) {
                const firstHeader = visibleCategories[0].querySelector('.category-header');
                if (firstHeader && !firstHeader.classList.contains('active')) {
                    // Закрываем все активные
                    document.querySelectorAll('.category-header.active').forEach(h => {
                        h.classList.remove('active');
                        h.nextElementSibling.classList.remove('expanded');
                    });

                    // Открываем первую видимую
                    firstHeader.classList.add('active');
                    firstHeader.nextElementSibling.classList.add('expanded');
                }
            }
        }

        function updateProgressCircles() {
            const circles = document.querySelectorAll('.readiness-circle');
            circles.forEach(circle => {
                const readiness = parseInt(circle.dataset.readiness || '0');
                circle.style.setProperty('--readiness-percent', readiness + '%');

                // Меняем цвет в зависимости от готовности
                let color = '#dc3545'; // critical
                if (readiness >= 85) color = '#28a745'; // excellent
                else if (readiness >= 70) color = '#17a2b8'; // good
                else if (readiness >= 50) color = '#ffc107'; // warning

                circle.style.background = \`conic-gradient(\${color} 0% \${readiness}%, var(--bg-secondary) \${readiness}% 100%)\`;
            });
        }

        // Обработка клавиатурных сокращений
        document.addEventListener('keydown', function(e) {
            // Ctrl+F для фокуса на поиске
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }

            // Ctrl+D для переключения темы
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                toggleTheme();
            }

            // Escape для очистки поиска
            if (e.key === 'Escape') {
                const searchInput = document.getElementById('searchInput');
                if (searchInput.value) {
                    searchInput.value = '';
                    searchReport();
                }
            }
        });
    </script>`;
  }

  private generateContent(data: ReportData, config: ReportConfig): string {
    const header = this.generateHeader(data);
    const summary = this.generateSummary(data);
    const categories = this.generateCategories(data, config);
    const recommendations = config.includeRecommendations ? this.generateRecommendations(data) : '';
    const metadata = this.generateMetadata(data);

    return `
        ${header}
        ${summary}
        ${categories}
        ${recommendations}
        ${metadata}
    `;
  }

  private generateHeader(data: ReportData): string {
    return `
        <div class="header">
            <h1>🔍 EAP Analyzer Report</h1>
            <p class="subtitle">Проект: ${data.projectPath}</p>
            <p class="subtitle">Сгенерирован: ${new Date(data.timestamp).toLocaleString('ru-RU')}</p>
        </div>
    `;
  }

  private generateSummary(data: ReportData): string {
    const { summary } = data;

    return `
        <div class="summary-grid">
            <div class="summary-card ${summary.status}">
                <div class="readiness-circle ${summary.status}" data-readiness="${summary.totalReadiness}">
                    <span>${summary.totalReadiness}%</span>
                </div>
                <div class="label">Общая готовность</div>
            </div>

            <div class="summary-card">
                <div class="value">${summary.componentsCount}</div>
                <div class="label">Компонентов</div>
            </div>

            <div class="summary-card ${summary.issuesCount > 10 ? 'warning' : 'good'}">
                <div class="value">${summary.issuesCount}</div>
                <div class="label">Проблем найдено</div>
            </div>

            <div class="summary-card">
                <div class="value">${summary.recommendationsCount}</div>
                <div class="label">Рекомендаций</div>
            </div>

            <div class="summary-card ${summary.criticalIssues > 0 ? 'critical' : 'excellent'}">
                <div class="value">${summary.criticalIssues}</div>
                <div class="label">Критичных проблем</div>
            </div>
        </div>
    `;
  }

  private generateCategories(data: ReportData, config: ReportConfig): string {
    const categoriesHTML = data.categories
      .map(category => this.generateCategoryCard(category, config))
      .join('');

    return `
        <div class="categories">
            ${categoriesHTML}
        </div>
    `;
  }

  private generateCategoryCard(category: any, config: ReportConfig): string {
    const componentsHTML = category.components
      .map((component: any) => this.generateComponentCard(component, config))
      .join('');

    const iconMap: Record<string, string> = {
      security: '🔒',
      testing: '🧪',
      performance: '⚡',
      quality: '✨',
      documentation: '📚',
    };

    return `
        <div class="category-card">
            <div class="category-header">
                <div class="category-title">
                    <div class="category-icon">
                        ${iconMap[category.slug] || '📊'}
                    </div>
                    <div class="category-info">
                        <h3>${category.name}</h3>
                        <p>${category.description}</p>
                    </div>
                </div>
                <div class="category-status">
                    <div class="readiness-badge ${category.status}">${category.readiness}%</div>
                    <div class="expand-icon">▼</div>
                </div>
            </div>
            <div class="category-content">
                <div class="components-grid">
                    ${componentsHTML}
                </div>
            </div>
        </div>
    `;
  }

  private generateComponentCard(component: any, config: ReportConfig): string {
    const detailsHTML = config.includeDetails
      ? `
        <div class="component-details">
            <div class="detail-item">
                <div class="detail-value">${component.details.filesAnalyzed}</div>
                <div class="detail-label">Файлов</div>
            </div>
            <div class="detail-item">
                <div class="detail-value">${component.details.testsCount}</div>
                <div class="detail-label">Тестов</div>
            </div>
            <div class="detail-item">
                <div class="detail-value">${component.details.coverage ? component.details.coverage + '%' : 'N/A'}</div>
                <div class="detail-label">Покрытие</div>
            </div>
            <div class="detail-item">
                <div class="detail-value">${component.issues.length}</div>
                <div class="detail-label">Проблем</div>
            </div>
        </div>
    `
      : '';

    const issuesHTML =
      component.issues.length > 0
        ? `
        <div class="issues-section">
            <h4>🚨 Проблемы:</h4>
            <div class="issues-list">
                ${component.issues
                  .map(
                    (issue: any) => `
                    <div class="issue-item ${issue.severity}">
                        <strong>${issue.type.toUpperCase()}:</strong> ${issue.message}
                        ${issue.file ? `<br><small>📁 ${issue.file}${issue.line ? `:${issue.line}` : ''}</small>` : ''}
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>
    `
        : '';

    return `
        <div class="component-card ${component.status}">
            <div class="component-header">
                <div class="component-name">${component.name}</div>
                <div class="readiness-badge ${component.status}">${component.readiness}%</div>
            </div>
            ${detailsHTML}
            ${issuesHTML}
        </div>
    `;
  }

  private generateRecommendations(data: ReportData): string {
    if (data.recommendations.length === 0) {
      return '';
    }

    const recommendationsHTML = data.recommendations
      .map(
        rec => `
        <div class="recommendation-card ${rec.priority}">
            <h4>${rec.title}</h4>
            <p>${rec.description}</p>
            <p><strong>Действие:</strong> ${rec.action}</p>
            <p><strong>Категория:</strong> ${rec.category} | <strong>Время:</strong> ${rec.estimatedTime}</p>
        </div>
    `
      )
      .join('');

    return `
        <div class="recommendations-section">
            <h2>💡 Рекомендации по улучшению</h2>
            <div class="recommendations-grid">
                ${recommendationsHTML}
            </div>
        </div>
    `;
  }

  private generateMetadata(data: ReportData): string {
    return `
        <div class="metadata">
            <p>
                Сгенерировано EAP Analyzer v${data.metadata.version} |
                Node.js ${data.metadata.nodeVersion} |
                ${data.metadata.os} |
                Время анализа: ${Math.round(data.metadata.totalAnalysisTime / 1000)}с
            </p>
        </div>
    `;
  }
}
