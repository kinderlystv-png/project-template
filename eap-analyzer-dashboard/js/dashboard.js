// Dashboard.js - основной модуль управления дашбордом EAP Analyzer
class EAPDashboard {
  constructor() {
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.initialized = false;
    this.componentsData = {};
    this.statistics = {};
  }

  /**
   * Инициализация дашборда
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('📊 Инициализация EAP Analyzer Dashboard...');

      // Ждем загрузки данных с таймаутом
      let retries = 0;
      while (!window.EAP_DATA && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      // Проверка доступности данных
      if (!window.EAP_DATA || !window.EAP_DATA.components) {
        console.warn('Данные не загружены, используем заглушку');
        this.componentsData = {};
      } else {
        this.componentsData = window.EAP_DATA.components;
      }

      this.calculateStatistics();

      // Инициализация UI компонентов
      this.initializeEventListeners();
      this.initializeFilters();
      this.initializeSearch();
      this.initializeSorting();

      // Отрисовка интерфейса
      this.renderSummaryCards();
      this.renderComponentsList();
      this.renderTopComponents();

      // Инициализация графиков после проверки Chart.js
      await this.initializeChartsWhenReady();

      this.initialized = true;
      console.log('✅ Dashboard успешно инициализирован');
    } catch (error) {
      console.error('❌ Ошибка инициализации dashboard:', error);
      this.showError('Ошибка загрузки дашборда: ' + error.message);
    }
  }

  /**
   * Ожидание загрузки Chart.js и инициализация графиков
   */
  async initializeChartsWhenReady() {
    let attempts = 0;
    const maxAttempts = 50; // 5 секунд

    console.log('🔄 Ожидание загрузки Chart.js и EAPCharts...');

    while (attempts < maxAttempts) {
      if (typeof Chart !== 'undefined') {
        console.log('📊 Chart.js найден, инициализируем графики...');

        // Создаем экземпляр EAPChartsManager если его нет
        if (!window.EAPCharts) {
          console.log('🔧 Создаем EAPChartsManager...');
          window.EAPCharts = new EAPChartsManager();
        }

        const success = window.EAPCharts.initializeCharts();
        if (success) {
          console.log('✅ Графики инициализированы успешно');
        } else {
          console.warn('⚠️ Графики инициализированы с ошибками');
        }
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    console.warn('⚠️ Chart.js не загрузился в течение ожидаемого времени, продолжаем без графиков');

    // Показываем предупреждение пользователю
    this.showChartWarning();
  }

  /**
   * Показать предупреждение об отсутствии графиков
   */
  showChartWarning() {
    const chartSections = document.querySelectorAll('[id*="chart"]');
    chartSections.forEach(section => {
      if (section.tagName === 'CANVAS') {
        const parent = section.closest('.card-body') || section.parentElement;
        if (parent) {
          parent.innerHTML = `
                        <div class="alert alert-info text-center">
                            <i class="bi bi-info-circle"></i>
                            <p class="mb-1">Графики временно недоступны</p>
                            <small class="text-muted">Данные доступны в таблицах</small>
                        </div>
                    `;
        }
      }
    });
  } /**
   * Расчет общей статистики
   */
  calculateStatistics() {
    // Безопасная проверка данных
    if (!this.componentsData || typeof this.componentsData !== 'object') {
      this.statistics = {
        total: 0,
        avgLogic: 0,
        avgFunctionality: 0,
        avgOverall: 0,
        ready: 0,
        inProgress: 0,
        planned: 0,
      };
      return;
    }

    const components = Object.values(this.componentsData);
    const totalComponents = components.length;

    if (totalComponents === 0) {
      this.statistics = {
        total: 0,
        avgLogic: 0,
        avgFunctionality: 0,
        avgOverall: 0,
        ready: 0,
        inProgress: 0,
        planned: 0,
      };
      return;
    }

    let totalLogic = 0;
    let totalFunctionality = 0;
    let readyCount = 0;
    let inProgressCount = 0;
    let plannedCount = 0;

    components.forEach(component => {
      totalLogic += component.logic || 0;
      totalFunctionality += component.functionality || 0;

      const overall = ((component.logic || 0) + (component.functionality || 0)) / 2;
      if (overall >= 90) readyCount++;
      else if (overall >= 50) inProgressCount++;
      else plannedCount++;
    });

    this.statistics = {
      total: totalComponents,
      avgLogic: Math.round((totalLogic / totalComponents) * 10) / 10,
      avgFunctionality: Math.round((totalFunctionality / totalComponents) * 10) / 10,
      avgOverall: Math.round(((totalLogic + totalFunctionality) / (totalComponents * 2)) * 10) / 10,
      ready: readyCount,
      inProgress: inProgressCount,
      planned: plannedCount,
    };
  }

  /**
   * Инициализация обработчиков событий
   */
  initializeEventListeners() {
    // Переключение вкладок
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        this.switchTab(link.dataset.tab);
      });
    });

    // Обновление данных
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }

    // Экспорт данных
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    // Загрузка файла
    const loadFileBtn = document.getElementById('load-file');
    if (loadFileBtn) {
      loadFileBtn.addEventListener('change', e => this.loadFile(e));
    }
  }

  /**
   * Инициализация фильтров
   */
  initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Убираем активность со всех кнопок
        filterButtons.forEach(b => b.classList.remove('active'));
        // Добавляем активность на нажатую кнопку
        btn.classList.add('active');

        this.currentFilter = btn.dataset.filter;
        this.renderComponentsList();
      });
    });
  }

  /**
   * Инициализация поиска
   */
  initializeSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderComponentsList();
      });
    }
  }

  /**
   * Инициализация сортировки
   */
  initializeSorting() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        const [field, order] = e.target.value.split('-');
        this.sortBy = field;
        this.sortOrder = order;
        this.renderComponentsList();
      });
    }
  }

  /**
   * Переключение вкладок
   */
  switchTab(tabName) {
    // Скрываем все панели
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('show', 'active');
    });

    // Убираем активность со всех ссылок
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    // Показываем нужную панель
    const targetPane = document.getElementById(tabName + '-tab');
    if (targetPane) {
      targetPane.classList.add('show', 'active');
    }

    // Активируем нужную ссылку
    const targetLink = document.querySelector(`.nav-link[data-tab="${tabName}"]`);
    if (targetLink) {
      targetLink.classList.add('active');
    }
  }

  /**
   * Отрисовка карточек сводки
   */
  renderSummaryCards() {
    const stats = this.statistics;

    // Общее количество
    const totalElement = document.getElementById('total-components');
    if (totalElement) {
      totalElement.textContent = stats.total;
    }

    // Средняя готовность логики
    const logicElement = document.getElementById('avg-logic');
    if (logicElement) {
      logicElement.textContent = stats.avgLogic.toFixed(1) + '%';
    }

    // Средняя функциональность
    const funcElement = document.getElementById('avg-functionality');
    if (funcElement) {
      funcElement.textContent = stats.avgFunctionality.toFixed(1) + '%';
    }

    // Общая готовность
    const overallElement = document.getElementById('avg-overall');
    if (overallElement) {
      overallElement.textContent = stats.avgOverall.toFixed(1) + '%';
    }

    // Готовые компоненты
    const readyElement = document.getElementById('ready-count');
    if (readyElement) {
      readyElement.textContent = stats.ready;
    }

    // В разработке
    const progressElement = document.getElementById('progress-count');
    if (progressElement) {
      progressElement.textContent = stats.inProgress;
    }

    // Запланированные
    const plannedElement = document.getElementById('planned-count');
    if (plannedElement) {
      plannedElement.textContent = stats.planned;
    }
  }

  /**
   * Отрисовка списка компонентов
   */
  renderComponentsList() {
    const container = document.getElementById('components-list');
    if (!container) return;

    const filteredComponents = this.getFilteredComponents();

    if (filteredComponents.length === 0) {
      container.innerHTML = `
                <div class="text-center py-5">
                    <h5 class="text-muted">Компоненты не найдены</h5>
                    <p class="text-muted">Попробуйте изменить фильтры или поисковый запрос</p>
                </div>
            `;
      return;
    }

    let html = '';
    filteredComponents.forEach((component, index) => {
      const overall = ((component.logic + component.functionality) / 2).toFixed(1);
      const statusClass = this.getStatusClass(overall);
      const categoryInfo = window.EAP_DATA?.categories[component.category] || {
        name: component.category,
        color: '#6c757d',
      };

      html += `
                <div class="component-card border rounded-lg p-3 mb-3" data-component="${component.name}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="mb-1 fw-bold">${component.name}</h6>
                        <span class="badge bg-${statusClass} ms-2">${overall}%</span>
                    </div>

                    <div class="mb-2">
                        <span class="badge" style="background-color: ${categoryInfo.color}; color: white;">
                            ${categoryInfo.name}
                        </span>
                        <small class="text-muted ms-2">${component.file || 'Не указан файл'}</small>
                    </div>

                    <p class="text-muted small mb-3">${component.description || 'Описание отсутствует'}</p>

                    <div class="row mb-2">
                        <div class="col-6">
                            <small class="text-muted">Логика</small>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-primary" style="width: ${component.logic}%"></div>
                            </div>
                            <small>${component.logic}%</small>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Функциональность</small>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-success" style="width: ${component.functionality}%"></div>
                            </div>
                            <small>${component.functionality}%</small>
                        </div>
                    </div>

                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            ${component.tests ? `Тесты: ${component.tests}` : 'Тестов нет'}
                        </small>
                        <button class="btn btn-sm btn-outline-primary" onclick="dashboard.showComponentDetails('${component.name}')">
                            Детали
                        </button>
                    </div>
                </div>
            `;
    });

    container.innerHTML = html;
  }

  /**
   * Отрисовка топ компонентов
   */
  renderTopComponents() {
    const container = document.getElementById('top-components');
    if (!container || !window.EAP_DATA?.utils) return;

    const topComponents = window.EAP_DATA.utils.getTopComponents(5);

    let html = '';
    topComponents.forEach((component, index) => {
      const overall = ((component.logic + component.functionality) / 2).toFixed(1);
      const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;

      html += `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                        <span class="me-2">${medal}</span>
                        <strong>${component.name}</strong>
                        <br>
                        <small class="text-muted">${component.category}</small>
                    </div>
                    <span class="badge bg-success">${overall}%</span>
                </div>
            `;
    });

    container.innerHTML = html || '<p class="text-muted">Нет данных</p>';
  }

  /**
   * Получение отфильтрованных компонентов
   */
  getFilteredComponents() {
    let components = Object.values(this.componentsData);

    // Фильтрация по категории
    if (this.currentFilter !== 'all') {
      components = components.filter(comp => comp.category === this.currentFilter);
    }

    // Поиск
    if (this.searchQuery) {
      components = components.filter(
        comp =>
          comp.name.toLowerCase().includes(this.searchQuery) ||
          (comp.description && comp.description.toLowerCase().includes(this.searchQuery)) ||
          (comp.file && comp.file.toLowerCase().includes(this.searchQuery))
      );
    }

    // Сортировка
    components.sort((a, b) => {
      let valueA, valueB;

      switch (this.sortBy) {
        case 'logic':
          valueA = a.logic || 0;
          valueB = b.logic || 0;
          break;
        case 'functionality':
          valueA = a.functionality || 0;
          valueB = b.functionality || 0;
          break;
        case 'overall':
          valueA = (a.logic || 0) + (a.functionality || 0);
          valueB = (b.logic || 0) + (b.functionality || 0);
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }

      if (this.sortOrder === 'desc') {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      } else {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      }
    });

    return components;
  }

  /**
   * Определение CSS-класса статуса
   */
  getStatusClass(overall) {
    const score = parseFloat(overall);
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    if (score >= 50) return 'info';
    return 'secondary';
  }

  /**
   * Показать детали компонента
   */
  showComponentDetails(componentName) {
    const component = this.componentsData[componentName];
    if (!component) return;

    const overall = ((component.logic + component.functionality) / 2).toFixed(1);
    const categoryInfo = window.EAP_DATA?.categories[component.category] || {
      name: component.category,
    };

    const modalContent = `
            <div class="modal fade" id="componentModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${component.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Категория:</strong> ${categoryInfo.name}
                                </div>
                                <div class="col-md-6">
                                    <strong>Файл:</strong> ${component.file || 'Не указан'}
                                </div>
                            </div>

                            <div class="mb-3">
                                <strong>Описание:</strong><br>
                                ${component.description || 'Описание отсутствует'}
                            </div>

                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <div class="text-center">
                                        <h3 class="text-primary">${component.logic}%</h3>
                                        <small>Готовность логики</small>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="text-center">
                                        <h3 class="text-success">${component.functionality}%</h3>
                                        <small>Функциональность</small>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="text-center">
                                        <h3 class="text-info">${overall}%</h3>
                                        <small>Общая готовность</small>
                                    </div>
                                </div>
                            </div>

                            ${
                              component.tests
                                ? `
                                <div class="mb-3">
                                    <strong>Тестирование:</strong><br>
                                    <span class="badge bg-info">${component.tests}</span>
                                </div>
                            `
                                : ''
                            }

                            <canvas id="component-chart-${componentName}" style="height: 200px;"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Удаляем предыдущий модал если есть
    const existingModal = document.getElementById('componentModal');
    if (existingModal) {
      existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalContent);

    const modal = new bootstrap.Modal(document.getElementById('componentModal'));
    modal.show();

    // Создаем график компонента
    setTimeout(() => {
      if (window.EAPCharts) {
        window.EAPCharts.createComponentChart(`component-chart-${componentName}`, componentName, {
          currentLogic: component.logic,
          currentFunctionality: component.functionality,
        });
      }
    }, 500);
  }

  /**
   * Обновление данных
   */
  async refreshData() {
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
      refreshBtn.innerHTML = '<i class="fas fa-sync fa-spin me-1"></i> Обновление...';
      refreshBtn.disabled = true;
    }

    try {
      // Имитация загрузки данных
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.calculateStatistics();
      this.renderSummaryCards();
      this.renderComponentsList();
      this.renderTopComponents();

      if (window.EAPCharts) {
        window.EAPCharts.updateAllCharts();
      }

      this.showSuccess('Данные успешно обновлены');
    } catch (error) {
      this.showError('Ошибка обновления данных: ' + error.message);
    } finally {
      if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-sync me-1"></i> Обновить';
        refreshBtn.disabled = false;
      }
    }
  }

  /**
   * Экспорт данных
   */
  exportData() {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        statistics: this.statistics,
        components: this.componentsData,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `eap-analyzer-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showSuccess('Данные экспортированы');
    } catch (error) {
      this.showError('Ошибка экспорта: ' + error.message);
    }
  }

  /**
   * Загрузка файла
   */
  loadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(e.target.result);
          if (data.components) {
            this.componentsData = data.components;
            this.initialize();
            this.showSuccess('JSON файл загружен успешно');
          }
        } else if (file.name.endsWith('.md')) {
          if (window.EAPParser) {
            const parsed = window.EAPParser.parseMarkdown(e.target.result);
            this.componentsData = parsed.components;
            this.initialize();
            this.showSuccess('Markdown файл загружен успешно');
          }
        }
      } catch (error) {
        this.showError('Ошибка загрузки файла: ' + error.message);
      }
    };

    reader.readAsText(file);
  }

  /**
   * Показать сообщение об успехе
   */
  showSuccess(message) {
    this.showAlert(message, 'success');
  }

  /**
   * Показать сообщение об ошибке
   */
  showError(message) {
    this.showAlert(message, 'danger');
  }

  /**
   * Показать уведомление
   */
  showAlert(message, type) {
    const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show position-fixed"
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

    document.body.insertAdjacentHTML('beforeend', alertHtml);

    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
      const alerts = document.querySelectorAll('.alert');
      alerts.forEach(alert => {
        if (alert.textContent.includes(message)) {
          alert.remove();
        }
      });
    }, 5000);
  }
}

// Dashboard class will be initialized from HTML script
