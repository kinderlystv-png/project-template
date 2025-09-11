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
  initializeCharts() {
    // Расширенная проверка доступности Chart.js
    if (typeof Chart === 'undefined') {
      console.error('❌ Chart.js не загружен!');
      this.showChartError('Chart.js недоступен');
      return false;
    }

    console.log('📊 Chart.js версия:', Chart.version || 'неизвестна');
    console.log('📊 Доступные типы графиков:', Object.keys(Chart.controllers || {}));

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
    if (!ctx) return;

    const categoryData = this.prepareCategoryData();

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
                const categoryName = context[0].label.toLowerCase();
                const components =
                  window.EAP_DATA?.utils?.getComponentsByCategory(categoryName) || {};
                return `Компонентов: ${Object.keys(components).length}`;
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
    const categories = window.EAP_DATA?.categories || {};
    const labels = [];
    const logic = [];
    const functionality = [];

    Object.keys(categories).forEach(categoryKey => {
      const stats = window.EAP_DATA?.utils?.getCategoryStats(categoryKey);
      if (stats && stats.count > 0) {
        labels.push(categories[categoryKey].name);
        logic.push(Math.round(stats.avgLogic));
        functionality.push(Math.round(stats.avgFunctionality));
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
