// Dashboard.js - основной модуль управления дашбордом EAP Analyzer
class EAPDashboard {
  constructor() {
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.sortMode = 'category'; // По умолчанию сортируем по категориям
    this.initialized = false;
    this.componentsData = {};
    this.statistics = {};
    this.liveDataLoaded = false;
  }

  /**
   * Автоматическая загрузка актуального отчета
   */
  async loadLatestReport() {
    try {
      console.log('📊 Загрузка актуального отчета...');

      // Пробуем загрузить последний отчет
      const response = await fetch('./data/reports/EAP-ANALYZER-CURRENT-REPORT.md');
      if (!response.ok) {
        console.log('⚠️  Актуальный отчет не найден, используем статичные данные');
        return false;
      }

      const markdownText = await response.text();

      // Используем парсер для обновления данных
      const parsedData = this.parseMarkdownReport(markdownText);

      if (parsedData && Object.keys(parsedData.components).length > 0) {
        console.log(
          `📈 Обновлено ${Object.keys(parsedData.components).length} компонентов из live-отчета`
        );

        // Обновляем компоненты
        if (!window.EAP_DATA) {
          window.EAP_DATA = { components: {}, categories: {}, history: {}, utils: {} };
        }

        // Мержим данные - приоритет live-данным
        window.EAP_DATA.components = {
          ...window.EAP_DATA.components, // Сохраняем существующие
          ...parsedData.components, // Добавляем/обновляем live-данные
        };

        // Обновляем историю
        const today = new Date().toISOString().split('T')[0];
        if (!window.EAP_DATA.history) window.EAP_DATA.history = {};
        window.EAP_DATA.history[today] = {
          avgLogic: parsedData.avgLogic || 75,
          avgFunctionality: parsedData.avgFunctionality || 70,
          totalComponents: Object.keys(window.EAP_DATA.components).length,
          changes: [
            'Live-анализ проекта',
            `Загружено ${Object.keys(parsedData.components).length} компонентов`,
          ],
          source: 'live-analysis',
        };

        this.liveDataLoaded = true;
        console.log('✅ Live-данные успешно загружены и обновлены');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Ошибка при загрузке live-отчета:', error);
      return false;
    }
  }

  /**
   * Простой парсер MD-отчетов для извлечения данных компонентов
   */
  parseMarkdownReport(markdownText) {
    const components = {};
    let currentCategory = 'utils';
    let totalLogic = 0;
    let totalFunctionality = 0;
    let componentCount = 0;

    const lines = markdownText.split('\n');

    // Регулярные выражения для парсинга
    const categoryPattern = /###\s+\d+\.\s+.+?\*\*(.+?)\*\*\s+\[(\d+)%\s+\/\s+(\d+)%\]/;
    const componentPattern = /-\s+\*\*(.+?)\*\*\s+\[(\d+)%\s+\/\s+(\d+)%\]\s+-\s+(.+)/;

    for (const line of lines) {
      // Парсинг категории
      const categoryMatch = line.match(categoryPattern);
      if (categoryMatch) {
        const categoryName = categoryMatch[1];
        currentCategory = this.getCategoryKeyFromName(categoryName);
        continue;
      }

      // Парсинг компонента
      const componentMatch = line.match(componentPattern);
      if (componentMatch) {
        const [_, name, logic, functionality, description] = componentMatch;
        const componentKey = name.replace(/[^a-zA-Z0-9]/g, '');

        components[componentKey] = {
          name: name,
          category: currentCategory,
          logic: parseInt(logic),
          functionality: parseInt(functionality),
          description: description.trim(),
          file: this.guessFileFromName(name),
          tests: 'Live анализ',
          lastModified: new Date().toISOString().split('T')[0],
          source: 'live-analysis',
        };

        totalLogic += parseInt(logic);
        totalFunctionality += parseInt(functionality);
        componentCount++;
      }
    }

    return {
      components,
      avgLogic: componentCount ? Math.round(totalLogic / componentCount) : 0,
      avgFunctionality: componentCount ? Math.round(totalFunctionality / componentCount) : 0,
      componentCount,
    };
  }

  /**
   * Определение ключа категории по названию
   */
  getCategoryKeyFromName(categoryName) {
    const categoryMap = {
      TESTING: 'testing',
      SECURITY: 'security',
      PERFORMANCE: 'performance',
      DOCKER: 'docker',
      DEPENDENCIES: 'dependencies',
      LOGGING: 'logging',
      'CI/CD': 'cicd',
      'CODE QUALITY': 'codequality',
      CORE: 'core',
      AI: 'ai',
      ARCHITECTURE: 'architecture',
      UTILS: 'utils',
    };

    for (const [key, value] of Object.entries(categoryMap)) {
      if (categoryName.includes(key)) {
        return value;
      }
    }

    return 'utils';
  }

  /**
   * Получение отображаемого имени категории по ключу
   */
  getCategoryDisplayName(categoryKey) {
    const categoryNames = {
      all: 'Все категории',
      testing: 'Testing',
      security: 'Security',
      performance: 'Performance',
      docker: 'Docker',
      dependencies: 'Dependencies',
      logging: 'Logging',
      cicd: 'CI/CD',
      codequality: 'Code Quality',
      core: 'Core',
      ai: 'AI',
      architecture: 'Architecture',
      utils: 'Utils',
    };

    return categoryNames[categoryKey] || 'Unknown';
  }

  /**
   * Предположение о файле на основе имени компонента
   */
  guessFileFromName(name) {
    const fileName = name
      .replace(/([A-Z])/g, '-$1')
      .replace(/^-/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');

    return `eap-analyzer/${fileName}.js`;
  }

  /**
   * Инициализация дашборда
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('📊 Инициализация EAP Analyzer Dashboard...');

      // СНАЧАЛА пытаемся загрузить live-отчет
      await this.loadLatestReport();

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
      this.renderBottomComponents();
      this.updateCategoryCounters();

      // Инициализация графиков после проверки Chart.js
      await this.initializeChartsWhenReady();

      this.initialized = true;
      console.log('✅ Dashboard успешно инициализирован');

      // Показываем индикатор если загружены live-данные
      if (this.liveDataLoaded) {
        this.showLiveDataIndicator();
      }
    } catch (error) {
      console.error('❌ Ошибка инициализации dashboard:', error);
      this.showError('Ошибка загрузки дашборда: ' + error.message);
    }
  }

  /**
   * Показывает индикатор live-данных
   */
  showLiveDataIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'alert alert-success d-flex align-items-center mb-3';
    indicator.innerHTML = `
      <i class="bi bi-broadcast me-2"></i>
      <div>
        <strong>Live-анализ активен!</strong>
        Данные обновлены на основе реального состояния проекта.
        <button class="btn btn-link btn-sm p-0 ms-2" onclick="this.parentElement.parentElement.remove()">
          <i class="bi bi-x"></i>
        </button>
      </div>
    `;

    const container = document.querySelector('.container-fluid');
    if (container && container.firstElementChild) {
      container.insertBefore(indicator, container.firstElementChild);
    }
  }

  /**
   * Ручное обновление live-данных
   */
  async refreshLiveData() {
    const btn = document.getElementById('live-update-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML =
        '<i class="bi bi-arrow-clockwise spinner-border spinner-border-sm"></i> Обновление...';
    }

    try {
      const success = await this.loadLatestReport();

      if (success) {
        // Обновляем компоненты данными
        this.componentsData = window.EAP_DATA.components;
        this.calculateStatistics();

        // Перерисовываем интерфейс
        this.renderSummaryCards();
        this.renderComponentsList();
        this.renderTopComponents();
        this.renderBottomComponents();

        // Обновляем графики если они есть
        if (this.chartsManager) {
          this.chartsManager.updateCharts();
        }

        // Показываем уведомление об успехе
        this.showNotification('✅ Данные успешно обновлены!', 'success');

        // Обновляем дату в header
        document.getElementById('last-update').textContent = new Date().toLocaleDateString('ru-RU');
      } else {
        this.showNotification('⚠️ Live-отчет не найден. Сгенерируйте его сначала.', 'warning');
      }
    } catch (error) {
      console.error('Ошибка обновления данных:', error);
      this.showNotification('❌ Ошибка при обновлении данных', 'danger');
    }

    // Восстанавливаем кнопку
    if (btn) {
      btn.disabled = false;
      btn.innerHTML =
        '<i class="bi bi-arrow-clockwise"></i> <span class="d-none d-md-inline">Live Update</span>';
    }
  }

  /**
   * Показать уведомление
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
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

    // Кнопки сортировки для детального списка
    const sortByName = document.getElementById('sort-by-name');
    const sortByReadiness = document.getElementById('sort-by-readiness');
    const sortByCategory = document.getElementById('sort-by-category');

    if (sortByName) {
      sortByName.addEventListener('click', () => this.setSortMode('name'));
    }
    if (sortByReadiness) {
      sortByReadiness.addEventListener('click', () => this.setSortMode('readiness'));
    }
    if (sortByCategory) {
      sortByCategory.addEventListener('click', () => this.setSortMode('category'));
    }
  }

  /**
   * Установка режима сортировки
   */
  setSortMode(mode) {
    // Обновляем активные кнопки
    document
      .querySelectorAll('#sort-by-name, #sort-by-readiness, #sort-by-category')
      .forEach(btn => {
        btn.classList.remove('active');
      });
    document.getElementById(`sort-by-${mode}`).classList.add('active');

    this.sortMode = mode;
    this.renderComponentsList();
  }

  /**
   * Инициализация фильтров по категориям
   */
  initializeFilters() {
    const categoryButtons = document.querySelectorAll('[data-category]');

    // Устанавливаем начальное состояние - кнопка "Все" активна
    categoryButtons.forEach(btn => {
      const category = btn.dataset.category;
      if (category === 'all') {
        btn.className = 'btn btn-primary active';
      }
    });

    categoryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Убираем активность со всех кнопок категорий
        categoryButtons.forEach(b => {
          b.classList.remove(
            'active',
            'btn-primary',
            'btn-success',
            'btn-danger',
            'btn-warning',
            'btn-info',
            'btn-secondary',
            'btn-dark'
          );
          // Возвращаем outline стиль
          const category = b.dataset.category;
          if (category === 'all') {
            b.className = 'btn btn-outline-primary';
          } else if (category === 'testing') {
            b.className = 'btn btn-outline-success';
          } else if (category === 'security') {
            b.className = 'btn btn-outline-danger';
          } else if (category === 'performance') {
            b.className = 'btn btn-outline-warning';
          } else if (category === 'docker') {
            b.className = 'btn btn-outline-info';
          } else if (category === 'codequality') {
            b.className = 'btn btn-outline-dark';
          } else if (category === 'cicd') {
            b.className = 'btn btn-outline-success';
          } else if (category === 'logging') {
            b.className = 'btn btn-outline-primary';
          } else if (category === 'architecture') {
            b.className = 'btn btn-outline-primary';
          } else if (category === 'ai') {
            b.className = 'btn btn-outline-danger';
          } else {
            b.className = 'btn btn-outline-secondary';
          }
        });

        // Активируем нажатую кнопку
        const category = btn.dataset.category;
        if (category === 'all') {
          btn.className = 'btn btn-primary active';
        } else if (category === 'testing') {
          btn.className = 'btn btn-success active';
        } else if (category === 'security') {
          btn.className = 'btn btn-danger active';
        } else if (category === 'performance') {
          btn.className = 'btn btn-warning active';
        } else if (category === 'docker') {
          btn.className = 'btn btn-info active';
        } else if (category === 'codequality') {
          btn.className = 'btn btn-dark active';
        } else if (category === 'cicd') {
          btn.className = 'btn btn-success active';
        } else if (category === 'logging') {
          btn.className = 'btn btn-primary active';
        } else if (category === 'architecture') {
          btn.className = 'btn btn-primary active';
        } else if (category === 'ai') {
          btn.className = 'btn btn-danger active';
        } else {
          btn.className = 'btn btn-secondary active';
        }

        // Обновляем текущий фильтр и перерендериваем
        this.currentFilter = category;

        // Отладочная информация
        const allComponents = Object.values(this.componentsData);
        const filteredComponents = this.getFilteredComponents();
        console.log(`🔍 Фильтр: ${category}`);
        console.log(`📊 Всего компонентов: ${allComponents.length}`);
        console.log(`✅ Отфильтровано: ${filteredComponents.length}`);

        // Показываем уникальные категории, которые есть у компонентов
        const uniqueCategories = [...new Set(allComponents.map(c => c.category))];
        console.log(`🏷️  Уникальные категории в данных:`, uniqueCategories);

        if (category !== 'all') {
          const categoryComponents = allComponents.filter(c => c.category === category);
          console.log(`� Компоненты с категорией "${category}":`, categoryComponents.length);
          if (categoryComponents.length > 0) {
            console.log(
              `📋 Первые 5 компонентов:`,
              categoryComponents.slice(0, 5).map(c => c.name)
            );
          }
        }

        this.renderComponentsList();
        this.updateCategoryCounters();

        // Показываем уведомление
        const categoryName = this.getCategoryDisplayName(category);
        const components = this.getFilteredComponents();
        this.showNotification(
          `📂 Показано ${components.length} компонентов в категории "${categoryName}"`,
          'success'
        );
      });
    });
  } /**
   * Обновление счетчиков компонентов по категориям
   */
  updateCategoryCounters() {
    // Считаем компоненты по категориям
    const categoryStats = {};
    const allComponents = Object.values(this.componentsData);

    // Инициализируем счетчики
    const categories = [
      'all',
      'testing',
      'security',
      'performance',
      'docker',
      'dependencies',
      'logging',
      'cicd',
      'codequality',
      'core',
      'ai',
      'architecture',
      'utils',
    ];

    categories.forEach(cat => {
      categoryStats[cat] = 0;
    });

    // Подсчитываем компоненты
    categoryStats.all = allComponents.length;
    allComponents.forEach(comp => {
      if (comp.category && Object.prototype.hasOwnProperty.call(categoryStats, comp.category)) {
        categoryStats[comp.category]++;
      }
    });

    // Обновляем текст на кнопках
    const categoryButtons = document.querySelectorAll('[data-category]');
    categoryButtons.forEach(btn => {
      const category = btn.dataset.category;
      const count = categoryStats[category] || 0;

      // Получаем текущий HTML и проверяем наличие badge
      const currentHTML = btn.innerHTML;
      const hasExistingBadge = currentHTML.includes('badge');

      if (hasExistingBadge) {
        // Обновляем существующий badge
        const badge = btn.querySelector('.badge');
        if (badge) {
          badge.textContent = count;
        }
      } else {
        // Добавляем новый badge после текста
        const textParts = currentHTML.split('</i>');
        if (textParts.length === 2) {
          btn.innerHTML = `${textParts[0]}</i> ${textParts[1]} <span class="badge bg-light text-dark ms-1">${count}</span>`;
        }
      }
    }); // Обновляем общий счетчик категорий
    const categoryCountElement = document.getElementById('category-count');
    if (categoryCountElement) {
      const nonEmptyCategories = categories.filter(
        cat => cat !== 'all' && categoryStats[cat] > 0
      ).length;
      categoryCountElement.textContent = nonEmptyCategories;
    }
  } /**
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
    const container = document.getElementById('components-table-body');
    const countContainer = document.getElementById('total-components-count');
    if (!container) return;

    // Получаем отфильтрованные компоненты
    const filteredComponents = this.getFilteredComponents();
    let sortedComponents = [];

    switch (this.sortMode) {
      case 'name':
        // Сортировка по названию
        sortedComponents = [...filteredComponents].sort((a, b) => a.name.localeCompare(b.name));
        break;

      case 'readiness': {
        // Сортировка по готовности (по убыванию)
        sortedComponents = [...filteredComponents].sort((a, b) => {
          const overallA = (a.logic + a.functionality) / 2;
          const overallB = (b.logic + b.functionality) / 2;
          return overallB - overallA;
        });
        break;
      }

      case 'category':
      default: {
        // Группировка по категориям для логической сортировки, но визуально без группировки
        const categoryOrder = [
          'testing',
          'security',
          'performance',
          'docker',
          'dependencies',
          'logging',
          'cicd',
          'codequality',
          'core',
          'ai',
          'architecture',
          'utils',
        ];

        // Сначала добавляем компоненты в порядке категорий
        categoryOrder.forEach(category => {
          const categoryComponents = filteredComponents.filter(comp => comp.category === category);
          // Внутри категории сортируем по названию
          categoryComponents.sort((a, b) => a.name.localeCompare(b.name));
          sortedComponents.push(...categoryComponents);
        });

        // Добавляем оставшиеся компоненты, которые не попали в основные категории
        const remainingComponents = filteredComponents.filter(
          comp => !categoryOrder.includes(comp.category)
        );
        remainingComponents.sort((a, b) => a.name.localeCompare(b.name));
        sortedComponents.push(...remainingComponents);
        break;
      }
    }

    // Обновляем счетчик
    if (countContainer) {
      countContainer.textContent = sortedComponents.length;
    }

    if (sortedComponents.length === 0) {
      container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <h5 class="text-muted">Компоненты не найдены</h5>
                    </td>
                </tr>
            `;
      return;
    }

    let html = '';
    sortedComponents.forEach(component => {
      const categoryInfo = window.EAP_DATA?.categories[component.category] || {
        name: component.category,
        color: '#6c757d',
        icon: 'bi-gear',
      };

      // Получаем полный путь и имя файла
      const fileName = component.file ? component.file.split('/').pop() : 'Файл не указан';
      const filePath = component.file ? component.file : 'Путь не указан';

      // Определяем цвет прогресс-бара для логики
      let logicClass = 'bg-danger';
      if (component.logic >= 90) logicClass = 'bg-success';
      else if (component.logic >= 80) logicClass = 'bg-info';
      else if (component.logic >= 70) logicClass = 'bg-warning';

      // Определяем цвет прогресс-бара для функциональности
      let funcClass = 'bg-danger';
      if (component.functionality >= 90) funcClass = 'bg-success';
      else if (component.functionality >= 80) funcClass = 'bg-info';
      else if (component.functionality >= 70) funcClass = 'bg-warning';

      html += `
                <tr data-component-name="${component.name}" style="cursor: pointer;" title="Нажмите для детального анализа">
                    <td>
                        <div class="d-flex align-items-center">
                            <i class="${categoryInfo.icon} me-2" style="color: ${categoryInfo.color}"></i>
                            <div>
                                <div class="fw-bold">${component.name}</div>
                                <small class="text-muted">${categoryInfo.name}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div>
                            <code class="small fw-bold">${fileName}</code>
                            <br>
                            <small class="text-muted" title="Полный путь к файлу">${filePath}</small>
                        </div>
                    </td>
                    <td>
                        <span class="small">${component.description || 'Описание отсутствует'}</span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="progress me-2 flex-grow-1" style="height: 8px;">
                                <div class="progress-bar ${logicClass}" style="width: ${component.logic}%"></div>
                            </div>
                            <span class="small fw-bold">${component.logic}%</span>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="progress me-2 flex-grow-1" style="height: 8px;">
                                <div class="progress-bar ${funcClass}" style="width: ${component.functionality}%"></div>
                            </div>
                            <span class="small fw-bold">${component.functionality}%</span>
                        </div>
                    </td>
                    <td class="text-center">
                        <span class="badge bg-secondary">${component.tests || '0'}</span>
                    </td>
                </tr>
            `;
    });

    container.innerHTML = html;

    // Добавляем обработчики клика для детального анализа
    const rows = container.querySelectorAll('tr[data-component-name]');
    rows.forEach(row => {
      row.addEventListener('click', (e) => {
        // Предотвращаем клик если пользователь выделяет текст
        if (window.getSelection().toString().length > 0) return;

        const componentName = row.getAttribute('data-component-name');
        this.showComponentDetails(componentName);
      });

      // Добавляем эффект при наведении
      row.addEventListener('mouseenter', () => {
        row.style.backgroundColor = '#f8f9fa';
      });

      row.addEventListener('mouseleave', () => {
        row.style.backgroundColor = '';
      });
    });
  }

  /**
   * Отрисовка топ компонентов
   */
  renderTopComponents() {
    const container = document.getElementById('top-components-list');
    if (!container || !window.EAP_DATA?.utils) return;

    const topComponents = window.EAP_DATA.utils.getTopComponents(10);

    let html = '';
    topComponents.forEach((component, index) => {
      const overall = ((component.logic + component.functionality) / 2).toFixed(1);
      const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;

      html += `
                <div class="d-flex justify-content-between align-items-center py-1 border-bottom border-light">
                    <div class="flex-grow-1 me-2">
                        <span class="me-1 small">${medal}</span>
                        <small class="fw-bold">${component.name}</small>
                        <br>
                        <small class="text-muted" style="font-size: 0.75rem;">${component.category}</small>
                    </div>
                    <span class="badge bg-success small">${overall}%</span>
                </div>
            `;
    });

    container.innerHTML = html || '<p class="text-muted small">Нет данных</p>';
  }

  /**
   * Отрисовка худших компонентов (нуждающихся в доработке)
   */
  renderBottomComponents() {
    const container = document.getElementById('bottom-components-list');
    if (!container || !window.EAP_DATA?.utils) return;

    const bottomComponents = window.EAP_DATA.utils.getBottomComponents(10);

    let html = '';
    bottomComponents.forEach((component, index) => {
      const overall = ((component.logic + component.functionality) / 2).toFixed(1);
      const priority = index < 3 ? ['🚨', '⚠️', '🔧'][index] : `${index + 1}.`;

      // Определяем цвет бейджа на основе общего рейтинга
      let badgeClass = 'bg-danger';
      if (overall >= 70) badgeClass = 'bg-warning';
      if (overall >= 60) badgeClass = 'bg-secondary';

      html += `
                <div class="d-flex justify-content-between align-items-center py-1 border-bottom border-light">
                    <div class="flex-grow-1 me-2">
                        <span class="me-1 small">${priority}</span>
                        <small class="fw-bold">${component.name}</small>
                        <br>
                        <small class="text-muted" style="font-size: 0.75rem;">${component.category}</small>
                    </div>
                    <span class="badge ${badgeClass} small">${overall}%</span>
                </div>
            `;
    });

    container.innerHTML = html || '<p class="text-muted small">Нет данных</p>';
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
      this.renderBottomComponents();

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

  /**
   * Показать детальный анализ компонента
   */
  showComponentDetails(componentName) {
    const component = Object.values(this.componentsData).find(comp => comp.name === componentName);
    if (!component) {
      this.showError('Компонент не найден');
      return;
    }

    // Создаем модальное окно для детального анализа
    const modal = document.createElement('div');
    modal.classList.add('modal', 'fade', 'show');
    modal.style.display = 'block';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';

    const categoryInfo = window.EAP_DATA?.categories[component.category] || {
      name: component.category,
      color: '#6c757d',
      icon: 'bi-gear',
    };

    // Формируем HTML для модального окна
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="${categoryInfo.icon} me-2"></i>
              Детальный анализ: ${component.name}
            </h5>
            <button type="button" class="btn-close btn-close-white modal-close-btn" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <!-- Ключевые недостатки -->
            <div class="row mb-4">
              <div class="col-md-6">
                <div class="card border-danger">
                  <div class="card-header bg-danger text-white">
                    <h6 class="mb-0">⚠️ Ключевой недостаток логики</h6>
                  </div>
                  <div class="card-body">
                    <p class="mb-0">${component.logicIssue || "Недостатки в логике не обнаружены"}</p>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card border-warning">
                  <div class="card-header bg-warning text-dark">
                    <h6 class="mb-0">🔧 Ключевой недостаток функциональности</h6>
                  </div>
                  <div class="card-body">
                    <p class="mb-0">${component.functionalityIssue || "Недостатки в функциональности не обнаружены"}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Показатели готовности -->
            <div class="row mb-4">
              <div class="col-md-6">
                <div class="card bg-light">
                  <div class="card-body">
                    <h6 class="card-title text-primary">📊 Готовность логики</h6>
                    <div class="progress mb-2" style="height: 20px;">
                      <div class="progress-bar ${component.logic >= 80 ? 'bg-success' : component.logic >= 60 ? 'bg-warning' : 'bg-danger'}"
                           style="width: ${component.logic}%">${component.logic}%</div>
                    </div>
                    <small class="text-muted">Процент реализации логики компонента</small>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card bg-light">
                  <div class="card-body">
                    <h6 class="card-title text-success">🚀 Функциональность</h6>
                    <div class="progress mb-2" style="height: 20px;">
                      <div class="progress-bar ${component.functionality >= 80 ? 'bg-success' : component.functionality >= 60 ? 'bg-warning' : 'bg-danger'}"
                           style="width: ${component.functionality}%">${component.functionality}%</div>
                    </div>
                    <small class="text-muted">Процент работоспособности функций</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Основная информация -->
            <div class="row mb-3">
              <div class="col-md-6">
                <p><strong>Категория:</strong> <span class="badge" style="background-color: ${categoryInfo.color}">${this.getCategoryDisplayName(component.category)}</span></p>
                <p><strong>Файл:</strong> <code>${component.file || "Не указан"}</code></p>
                <p><strong>Тестирование:</strong> <span class="text-info">${component.tests || "Нет информации"}</span></p>
              </div>
              <div class="col-md-6">
                <p><strong>Размер файла:</strong> ${component.fileSize ? (component.fileSize / 1024).toFixed(1) + ' KB' : "Неизвестен"}</p>
                <p><strong>Строк кода:</strong> ${component.lines || "Неизвестно"}</p>
                <p><strong>Последнее изменение:</strong> ${component.lastModified || "Нет данных"}</p>
              </div>
            </div>

            <div class="mt-3">
              <h6>📝 Описание компонента:</h6>
              <p class="text-muted">${component.description || "Описание отсутствует"}</p>
            </div>

            <!-- Рекомендации по улучшению -->
            <div class="card border-info mt-3">
              <div class="card-header bg-info text-white">
                <h6 class="mb-0">💡 Рекомендации по улучшению</h6>
              </div>
              <div class="card-body">
                <ul class="mb-0">
                  ${component.logicIssue ? `<li><strong>Логика:</strong> ${this.getImprovementSuggestion(component.logicIssue)}</li>` : ''}
                  ${component.functionalityIssue ? `<li><strong>Функциональность:</strong> ${this.getImprovementSuggestion(component.functionalityIssue)}</li>` : ''}
                  <li><strong>Общее:</strong> Рассмотрите возможность рефакторинга для повышения показателей готовности</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary modal-close-btn">Закрыть</button>
            ${component.file ? `<a href="#" class="btn btn-outline-primary" onclick="navigator.clipboard.writeText('${component.file}')">📋 Копировать путь</a>` : ''}
          </div>
        </div>
      </div>
    `;

    // Добавляем обработчики закрытия
    const closeButtons = modal.querySelectorAll('.modal-close-btn');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    });

    // Закрытие по клику вне модального окна
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    // Закрытие по клавише Escape
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Добавляем модальное окно в DOM
    document.body.appendChild(modal);
  }

  /**
   * Генерировать предложение по улучшению на основе недостатка
   */
  getImprovementSuggestion(issue) {
    if (issue.toLowerCase().includes('тест')) {
      return 'Добавьте unit-тесты и интеграционные тесты';
    }
    if (issue.toLowerCase().includes('безопас') || issue.toLowerCase().includes('xss')) {
      return 'Внедрите валидацию входных данных и санитизацию';
    }
    if (issue.toLowerCase().includes('производительность') || issue.toLowerCase().includes('память')) {
      return 'Оптимизируйте алгоритмы и добавьте кэширование';
    }
    if (issue.toLowerCase().includes('обработк') || issue.toLowerCase().includes('ошибк')) {
      return 'Добавьте обработку исключений и логирование';
    }
    if (issue.toLowerCase().includes('документац')) {
      return 'Добавьте JSDoc комментарии и README';
    }
    if (issue.toLowerCase().includes('связность') || issue.toLowerCase().includes('модул')) {
      return 'Рефакторинг для снижения связности модулей';
    }
    return 'Ознакомьтесь с best practices для данной категории';
  }
}

// Dashboard class will be initialized from HTML script

// Dashboard class will be initialized from HTML script
