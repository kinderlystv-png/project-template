// Charts.js - модуль визуализации для EAP Analyzer Dashboard
class EAPChartsManager {
  constructor() {
    this.charts = {};
    this.colors = {
      logic: 'rgba(102, 126, 234, 0.8)',
      functionality: 'rgba(245, 87, 108, 0.8)',
      logicBorder: 'rgba(102, 126, 234, 1)',
      functionalityBorder: 'rgba(245, 87, 108, 1)',
      categories: {
        testing: '#28a745',
        security: '#dc3545',
        performance: '#ffc107',
        docker: '#17a2b8',
        core: '#6c757d',
        ai: '#e83e8c',
      },
    };
  }

  /**
   * Инициализация всех графиков
   */
  async initializeCharts() {
    // Расширенная проверка доступности Chart.js
    if (typeof Chart === 'undefined') {
      console.error('❌ Chart.js не загружен!');
      this.showChartError('Chart.js недоступен');
      return false;
    }

    // Chart.js успешно инициализирован

    // Ждем немного для загрузки данных
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      this.createCategoriesOverviewChart();
      this.createTimelineChart();
      this.updateAllCharts();
      return true;
    } catch (error) {
      console.error('❌ Ошибка инициализации графиков:', error);
      this.showChartError(error.message);
      return false;
    }
  }

  /**
   * Показать ошибку в контейнерах графиков
   */
  showChartError(message) {
    const chartContainers = ['categories-chart', 'timeline-chart'];
    chartContainers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        const parent = container.parentElement;
        parent.innerHTML = `
                    <div class="alert alert-warning text-center">
                        <i class="bi bi-exclamation-triangle"></i>
                        <p class="mb-0">График недоступен: ${message}</p>
                        <small>Данные отображаются в таблицах ниже</small>
                    </div>
                `;
      }
    });
  }

  /**
   * График обзора по категориям
   */
  createCategoriesOverviewChart() {
    const ctx = document.getElementById('categories-chart');
    if (!ctx) {
      console.error('❌ Элемент categories-chart не найден!');
      return;
    }

    const categoryData = this.prepareCategoryData();

    if (!categoryData.labels || categoryData.labels.length === 0) {
      console.error('❌ Нет данных для отображения диаграммы!');
      ctx.getContext('2d').fillText('Нет данных для отображения', 10, 50);
      return;
    }

    this.charts.categories = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categoryData.labels,
        datasets: [
          {
            label: 'Готовность логики',
            data: categoryData.logic,
            backgroundColor: this.colors.logic,
            borderColor: this.colors.logicBorder,
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Функциональность',
            data: categoryData.functionality,
            backgroundColor: this.colors.functionality,
            borderColor: this.colors.functionalityBorder,
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              font: {
                size: 12,
                weight: '600',
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: function (context) {
                return `Категория: ${context[0].label}`;
              },
              label: function (context) {
                return `${context.dataset.label}: ${context.parsed.y}%`;
              },
              afterBody: function (context) {
                const categoryLabel = context[0].label;
                const dashboard = window.dashboardInstance;

                if (!dashboard || !dashboard.componentsData) {
                  return 'Данные недоступны';
                }

                // Получаем отфильтрованные компоненты
                const filteredComponents = dashboard.getFilteredComponents();

                // Группируем по категориям для подсчета
                const categoryStats = {};
                filteredComponents.forEach(comp => {
                  const categoryName =
                    window.EAP_DATA?.categories?.[comp.category]?.name || comp.category;
                  if (categoryName === categoryLabel) {
                    if (!categoryStats[categoryName]) {
                      categoryStats[categoryName] = {
                        count: 0,
                        totalLogic: 0,
                        totalFunctionality: 0,
                      };
                    }
                    categoryStats[categoryName].count++;
                    categoryStats[categoryName].totalLogic += comp.logic || 0;
                    categoryStats[categoryName].totalFunctionality += comp.functionality || 0;
                  }
                });

                const stats = categoryStats[categoryLabel];
                if (stats && stats.count > 0) {
                  const avgLogic = Math.round(stats.totalLogic / stats.count);
                  const avgFunctionality = Math.round(stats.totalFunctionality / stats.count);

                  return [
                    `Компонентов: ${stats.count}`,
                    `Логика: ${avgLogic}%`,
                    `Функциональность: ${avgFunctionality}%`,
                  ];
                }

                return 'Данные недоступны';
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 11,
                weight: '500',
              },
            },
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              lineWidth: 1,
            },
            ticks: {
              callback: function (value) {
                return value + '%';
              },
              font: {
                size: 10,
              },
            },
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart',
        },
      },
    });

    // Обработчик для переключения типа графика
    this.setupChartTypeToggle();
  }

  /**
   * График временной шкалы
   */
  createTimelineChart() {
    const ctx = document.getElementById('timeline-chart');
    if (!ctx) return;

    const timelineData = this.prepareTimelineData();

    this.charts.timeline = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timelineData.dates,
        datasets: [
          {
            label: 'Общая готовность логики',
            data: timelineData.avgLogic,
            borderColor: this.colors.logicBorder,
            backgroundColor: this.colors.logic,
            fill: false,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: this.colors.logicBorder,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
          {
            label: 'Общая функциональность',
            data: timelineData.avgFunctionality,
            borderColor: this.colors.functionalityBorder,
            backgroundColor: this.colors.functionality,
            fill: false,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: this.colors.functionalityBorder,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              font: {
                size: 12,
                weight: '600',
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              title: function (context) {
                return `Дата: ${context[0].label}`;
              },
              label: function (context) {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: false,
            min: 60,
            max: 100,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              lineWidth: 1,
            },
            ticks: {
              callback: function (value) {
                return value.toFixed(0) + '%';
              },
              font: {
                size: 10,
              },
            },
          },
        },
        animation: {
          duration: 1500,
          easing: 'easeInOutQuart',
        },
      },
    });
  }

  /**
   * Создание графика для отдельного компонента
   */
  createComponentChart(containerId, componentName, historyData) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return null;

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: historyData.dates || ['Текущее состояние'],
        datasets: [
          {
            label: 'Готовность логики',
            data: historyData.logic || [historyData.currentLogic || 0],
            borderColor: this.colors.logicBorder,
            backgroundColor: this.colors.logic,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Функциональность',
            data: historyData.functionality || [historyData.currentFunctionality || 0],
            borderColor: this.colors.functionalityBorder,
            backgroundColor: this.colors.functionality,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            cornerRadius: 6,
            callbacks: {
              title: function (context) {
                return componentName;
              },
            },
          },
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            beginAtZero: true,
            max: 100,
            display: false,
          },
        },
        animation: {
          duration: 800,
        },
      },
    });
  }

  /**
   * Подготовка данных по категориям
   */
  prepareCategoryData() {
    // Проверяем есть ли активный фильтр классификации
    const dashboard = window.dashboardInstance;
    const classificationFilter = dashboard?.currentClassificationFilter || 'all';

    if (classificationFilter !== 'all') {
      // Если есть фильтр классификации, пересчитываем данные
      return this.prepareCategoryDataWithFilter(classificationFilter);
    }

    // Иначе используем стандартные данные
    const categories = window.EAP_DATA?.categories || {};
    const labels = [];
    const logic = [];
    const functionality = [];

    Object.keys(categories).forEach(categoryKey => {
      const category = categories[categoryKey];

      if (category && category.count > 0) {
        labels.push(category.name);
        logic.push(Math.round(category.logic || 0));
        functionality.push(Math.round(category.functionality || 0));
      }
    });

    return { labels, logic, functionality };
  }

  /**
   * Подготовка данных по категориям с фильтром классификации
   */
  prepareCategoryDataWithFilter(classificationFilter) {
    const dashboard = window.dashboardInstance;
    if (!dashboard || !dashboard.componentsData) {
      return { labels: [], logic: [], functionality: [] };
    }

    // Получаем все компоненты и фильтруем по классификации
    const allComponents = Object.values(dashboard.componentsData);
    const filteredComponents = allComponents.filter(comp => {
      return comp.classification === classificationFilter;
    });

    // Группируем по категориям
    const categoryStats = {};
    filteredComponents.forEach(comp => {
      const category = comp.category;
      if (!categoryStats[category]) {
        categoryStats[category] = {
          count: 0,
          totalLogic: 0,
          totalFunctionality: 0,
        };
      }
      categoryStats[category].count++;
      categoryStats[category].totalLogic += comp.logic || 0;
      categoryStats[category].totalFunctionality += comp.functionality || 0;
    });

    // Подготавливаем данные для диаграммы
    const labels = [];
    const logic = [];
    const functionality = [];

    Object.keys(categoryStats).forEach(categoryKey => {
      const stats = categoryStats[categoryKey];
      if (stats.count > 0) {
        // Получаем название категории из исходных данных
        const categoryName = window.EAP_DATA?.categories?.[categoryKey]?.name || categoryKey;

        labels.push(categoryName);
        logic.push(Math.round(stats.totalLogic / stats.count));
        functionality.push(Math.round(stats.totalFunctionality / stats.count));
      }
    });

    return { labels, logic, functionality };
  }

  /**
   * Подготовка данных временной шкалы
   */
  prepareTimelineData() {
    const history = window.EAP_DATA?.history || {};
    const dates = Object.keys(history).sort();
    const avgLogic = [];
    const avgFunctionality = [];

    dates.forEach(date => {
      avgLogic.push(history[date].avgLogic);
      avgFunctionality.push(history[date].avgFunctionality);
    });

    return {
      dates: dates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      }),
      avgLogic,
      avgFunctionality,
    };
  }

  /**
   * Настройка переключателя типа графика
   */
  setupChartTypeToggle() {
    const lineChartBtn = document.getElementById('line-chart');
    const barChartBtn = document.getElementById('bar-chart');

    if (!lineChartBtn || !barChartBtn || !this.charts.categories) return;

    const toggleChartType = type => {
      this.charts.categories.config.type = type;
      this.charts.categories.update();
    };

    lineChartBtn.addEventListener('change', () => {
      if (lineChartBtn.checked) toggleChartType('line');
    });

    barChartBtn.addEventListener('change', () => {
      if (barChartBtn.checked) toggleChartType('bar');
    });
  }

  /**
   * Обновление всех графиков
   */
  updateAllCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.update) {
        chart.update();
      }
    });
  }

  /**
   * Обновление диаграммы категорий с новыми данными
   */
  updateCategoriesChart() {
    if (!this.charts.categories) {
      return;
    }

    // Получаем новые данные
    const categoryData = this.prepareCategoryData();

    if (!categoryData.labels || categoryData.labels.length === 0) {
      return;
    }

    // Обновляем данные диаграммы
    this.charts.categories.data.labels = categoryData.labels;
    this.charts.categories.data.datasets[0].data = categoryData.logic;
    this.charts.categories.data.datasets[1].data = categoryData.functionality;

    // Применяем изменения
    this.charts.categories.update('active');
  }

  /**
   * Уничтожение графика
   */
  destroyChart(chartName) {
    if (this.charts[chartName]) {
      this.charts[chartName].destroy();
      delete this.charts[chartName];
    }
  }

  /**
   * Уничтожение всех графиков
   */
  destroyAllCharts() {
    Object.keys(this.charts).forEach(chartName => {
      this.destroyChart(chartName);
    });
  }
}

// EAPChartsManager class - will be instantiated from HTML
