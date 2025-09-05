<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import * as THREE from 'three';

  export let containerWidth = 800;
  export let containerHeight = 600;
  export let showControls = true;
  export let enablePhysics = false;
  export let backgroundColor = 0x1a1a1a;

  const dispatch = createEventDispatcher();

  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: any; // OrbitControls will be loaded dynamically
  let animationId: number;

  // 3D объекты
  let constructorObjects: THREE.Object3D[] = [];
  let selectedObject: THREE.Object3D | null = null;
  let raycaster: THREE.Raycaster;
  let mouse: THREE.Vector2;

  // Состояние интерфейса
  let isLoading = true;
  // const currentTool = 'select'; // TODO: implement tool selection
  const availableObjects = [
    { id: 'cube', name: 'Куб', color: '#3b82f6' },
    { id: 'sphere', name: 'Сфера', color: '#ef4444' },
    { id: 'cylinder', name: 'Цилиндр', color: '#10b981' },
    { id: 'cone', name: 'Конус', color: '#f59e0b' },
    { id: 'torus', name: 'Тор', color: '#8b5cf6' },
    { id: 'plane', name: 'Плоскость', color: '#6b7280' },
  ];

  // Материалы
  const materials = {
    default: new THREE.MeshPhongMaterial({ color: 0x4f46e5 }),
    selected: new THREE.MeshPhongMaterial({ color: 0xfbbf24, wireframe: false }),
    wireframe: new THREE.MeshPhongMaterial({ wireframe: true }),
  };

  onMount(async () => {
    await initThreeJS();
    setupScene();
    setupLights();
    setupControls();
    setupEventListeners();
    animate();
    isLoading = false;
  });

  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (renderer) {
      renderer.dispose();
    }
  });

  async function initThreeJS() {
    // Инициализация Three.js
    scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerWidth, containerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Инициализация вспомогательных объектов
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
  }

  function setupScene() {
    // Добавляем сетку
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444);
    scene.add(gridHelper);

    // Добавляем оси координат
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
  }

  function setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Point light
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-10, 10, -10);
    scene.add(pointLight);
  }

  async function setupControls() {
    if (showControls) {
      try {
        // Динамически загружаем OrbitControls
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2;
      } catch (error) {
        console.warn('OrbitControls not available:', error);
      }
    }
  }

  function setupEventListeners() {
    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
  }

  function onMouseClick(event: MouseEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(constructorObjects);

    if (intersects.length > 0) {
      selectObject(intersects[0].object);
    } else {
      deselectObject();
    }
  }

  function onMouseMove(event: MouseEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onKeyDown(event: KeyboardEvent) {
    if (selectedObject) {
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          removeObject(selectedObject);
          break;
        case 'ArrowUp':
          selectedObject.position.y += 0.1;
          break;
        case 'ArrowDown':
          selectedObject.position.y -= 0.1;
          break;
        case 'ArrowLeft':
          selectedObject.position.x -= 0.1;
          break;
        case 'ArrowRight':
          selectedObject.position.x += 0.1;
          break;
        case 'r':
        case 'R':
          selectedObject.rotation.y += Math.PI / 8;
          break;
      }
      dispatch('objectUpdated', { object: selectedObject });
    }
  }

  function animate() {
    animationId = requestAnimationFrame(animate);

    if (controls) {
      controls.update();
    }

    // Анимация объектов
    constructorObjects.forEach((obj, index) => {
      if (obj.userData.animated) {
        obj.rotation.y += 0.01;
        obj.position.y = Math.sin(Date.now() * 0.001 + index) * 0.1 + obj.userData.baseY;
      }
    });

    renderer.render(scene, camera);
  }

  function addObject(type: string) {
    let geometry: THREE.BufferGeometry;
    let material = materials.default.clone();

    const objectConfig = availableObjects.find(obj => obj.id === type);
    if (objectConfig) {
      material.color.setHex(objectConfig.color.replace('#', '0x'));
    }

    switch (type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(0.5, 1, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
        break;
      case 'plane':
        geometry = new THREE.PlaneGeometry(2, 2);
        material = new THREE.MeshPhongMaterial({
          color: objectConfig?.color || '#6b7280',
          side: THREE.DoubleSide,
        });
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (Math.random() - 0.5) * 10,
      Math.random() * 3 + 1,
      (Math.random() - 0.5) * 10
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      type,
      id: Date.now(),
      animated: false,
      baseY: mesh.position.y,
    };

    scene.add(mesh);
    constructorObjects.push(mesh);

    dispatch('objectAdded', { object: mesh, type });
  }

  function selectObject(object: THREE.Object3D) {
    deselectObject();
    selectedObject = object;
    const originalMaterial = (object as THREE.Mesh).material;
    (object as THREE.Mesh).material = materials.selected;
    object.userData.originalMaterial = originalMaterial;

    dispatch('objectSelected', { object });
  }

  function deselectObject() {
    if (selectedObject) {
      if (selectedObject.userData.originalMaterial) {
        (selectedObject as THREE.Mesh).material = selectedObject.userData.originalMaterial;
      }
      selectedObject = null;
      dispatch('objectDeselected');
    }
  }

  function removeObject(object: THREE.Object3D) {
    scene.remove(object);
    const index = constructorObjects.indexOf(object);
    if (index > -1) {
      constructorObjects.splice(index, 1);
    }
    if (selectedObject === object) {
      selectedObject = null;
    }
    dispatch('objectRemoved', { object });
  }

  function clearScene() {
    constructorObjects.forEach(obj => {
      scene.remove(obj);
    });
    constructorObjects = [];
    selectedObject = null;
    dispatch('sceneCleared');
  }

  function exportScene() {
    const sceneData = constructorObjects.map(obj => ({
      type: obj.userData.type,
      position: obj.position.toArray(),
      rotation: obj.rotation.toArray(),
      scale: obj.scale.toArray(),
      material: {
        color: (obj as THREE.Mesh).material.color?.getHex(),
      },
    }));

    dispatch('sceneExported', { data: sceneData });
    return sceneData;
  }

  function importScene(sceneData: any[]) {
    clearScene();

    sceneData.forEach(objData => {
      addObject(objData.type);
      const lastObject = constructorObjects[constructorObjects.length - 1];

      lastObject.position.fromArray(objData.position);
      lastObject.rotation.fromArray(objData.rotation);
      lastObject.scale.fromArray(objData.scale);

      if (objData.material?.color) {
        ((lastObject as THREE.Mesh).material as THREE.MeshPhongMaterial).color.setHex(
          objData.material.color
        );
      }
    });

    dispatch('sceneImported', { data: sceneData });
  }

  function toggleAnimation() {
    if (selectedObject) {
      selectedObject.userData.animated = !selectedObject.userData.animated;
      selectedObject.userData.baseY = selectedObject.position.y;
      dispatch('animationToggled', { object: selectedObject });
    }
  }

  // Экспорт функций для внешнего использования
  export { addObject, clearScene, exportScene, importScene, toggleAnimation };
</script>

<div class="constructor-3d" in:fly={{ y: 50, duration: 500, easing: quintOut }}>
  <!-- Загрузчик -->
  {#if isLoading}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Загрузка 3D конструктора...</p>
    </div>
  {/if}

  <!-- Панель инструментов -->
  <div class="toolbar">
    <div class="tool-group">
      <h3 class="tool-group-title">Объекты</h3>
      <div class="tool-buttons">
        {#each availableObjects as obj}
          <button
            class="tool-btn"
            style:border-color="{obj.color}"
            title="Добавить {obj.name}"
            on:click={() => addObject(obj.id)}
          >
            <span class="tool-icon" style:background-color="{obj.color}"></span>
            {obj.name}
          </button>
        {/each}
      </div>
    </div>

    <div class="tool-group">
      <h3 class="tool-group-title">Действия</h3>
      <div class="tool-buttons">
        <button class="action-btn clear" on:click={clearScene}>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Очистить
        </button>

        {#if selectedObject}
          <button class="action-btn animate" on:click={toggleAnimation}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-6 4h6"
              />
            </svg>
            {selectedObject.userData.animated ? 'Стоп' : 'Анимация'}
          </button>

          <button class="action-btn remove" on:click={() => removeObject(selectedObject)}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Удалить
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- 3D Viewport -->
  <div
    class="viewport"
    bind:this={container}
    style:width="{containerWidth}px" style:height="{containerHeight}px"
  ></div>

  <!-- Информационная панель -->
  <div class="info-panel">
    <div class="info-section">
      <h4>Статистика сцены</h4>
      <p>Объектов: {constructorObjects.length}</p>
      {#if selectedObject}
        <p>Выбран: {selectedObject.userData.type}</p>
        <p>
          Позиция: X: {selectedObject.position.x.toFixed(2)}, Y: {selectedObject.position.y.toFixed(
            2
          )}, Z: {selectedObject.position.z.toFixed(2)}
        </p>
      {/if}
    </div>

    <div class="info-section">
      <h4>Управление</h4>
      <ul class="controls-list">
        <li>ЛКМ - выбор объекта</li>
        <li>Стрелки - перемещение</li>
        <li>R - поворот</li>
        <li>Delete - удаление</li>
        <li>Колесо мыши - зум</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .constructor-3d {
    @apply relative w-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl;
  }

  .loading-overlay {
    @apply absolute inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-50;
  }

  .loading-spinner {
    @apply w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4;
  }

  .loading-overlay p {
    @apply text-white text-lg;
  }

  .toolbar {
    @apply absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4 shadow-lg z-10
           max-w-xs space-y-4;
  }

  .tool-group-title {
    @apply text-sm font-bold text-gray-800 mb-2;
  }

  .tool-buttons {
    @apply flex flex-wrap gap-2;
  }

  .tool-btn {
    @apply flex items-center gap-2 px-3 py-2 bg-white border-2 rounded-lg
           hover:bg-gray-50 transition-all duration-200 text-sm font-medium
           active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500;
  }

  .tool-icon {
    @apply w-3 h-3 rounded-full;
  }

  .action-btn {
    @apply flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm
           transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2;
  }

  .action-btn.clear {
    @apply bg-red-500 text-white hover:bg-red-600 focus:ring-red-500;
  }

  .action-btn.animate {
    @apply bg-green-500 text-white hover:bg-green-600 focus:ring-green-500;
  }

  .action-btn.remove {
    @apply bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500;
  }

  .viewport {
    @apply relative;
    min-height: 400px;
  }

  .viewport :global(canvas) {
    @apply rounded-lg;
  }

  .info-panel {
    @apply absolute bottom-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm 
           rounded-lg p-4 shadow-lg max-w-xs space-y-3;
  }

  .info-section h4 {
    @apply text-sm font-bold text-gray-800 mb-1;
  }

  .info-section p {
    @apply text-xs text-gray-600;
  }

  .controls-list {
    @apply text-xs text-gray-600 space-y-1;
  }

  .controls-list li {
    @apply flex items-center;
  }

  /* Адаптивность */
  @media (max-width: 768px) {
    .toolbar {
      @apply left-2 top-2 max-w-none w-auto;
    }

    .info-panel {
      @apply right-2 bottom-2 max-w-none w-auto;
    }

    .tool-buttons {
      @apply grid grid-cols-2;
    }
  }

  @media (max-width: 640px) {
    .viewport {
      min-height: 300px;
    }

    .toolbar,
    .info-panel {
      @apply text-xs;
    }
  }
</style>
