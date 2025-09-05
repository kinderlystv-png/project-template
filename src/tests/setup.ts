// @ts-ignore - необходимо для импорта модулей из testing-library
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Глобальные моки для тестирования

// Мок для Three.js
vi.mock('three', () => {
  return {
    Scene: vi.fn().mockImplementation(() => ({
      add: vi.fn(),
      remove: vi.fn(),
      children: [],
      background: null,
      fog: null,
      traverse: vi.fn(),
      getObjectByName: vi.fn(),
      getObjectById: vi.fn(),
    })),

    WebGLRenderer: vi.fn().mockImplementation(() => ({
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      setClearColor: vi.fn(),
      dispose: vi.fn(),
      domElement: document.createElement('canvas'),
      shadowMap: {
        enabled: false,
        type: null,
      },
    })),

    PerspectiveCamera: vi.fn().mockImplementation(() => ({
      position: {
        set: vi.fn(),
        x: 0,
        y: 0,
        z: 0,
        copy: vi.fn(),
        clone: vi.fn(),
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0,
        set: vi.fn(),
      },
      lookAt: vi.fn(),
      updateProjectionMatrix: vi.fn(),
      aspect: 1,
      fov: 75,
      near: 0.1,
      far: 1000,
    })),

    // Геометрии
    BoxGeometry: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
    })),
    SphereGeometry: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
    })),
    CylinderGeometry: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
    })),
    ConeGeometry: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
    })),
    TorusGeometry: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
    })),
    PlaneGeometry: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
    })),

    // Материалы
    MeshBasicMaterial: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
      color: { setHex: vi.fn(), getHex: vi.fn() },
    })),
    MeshPhongMaterial: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
      color: { setHex: vi.fn(), getHex: vi.fn() },
      wireframe: false,
    })),

    // Меши и объекты
    Mesh: vi.fn().mockImplementation(() => ({
      position: {
        set: vi.fn(),
        x: 0,
        y: 0,
        z: 0,
        copy: vi.fn(),
        clone: vi.fn(),
        toArray: vi.fn(() => [0, 0, 0]),
        fromArray: vi.fn(),
      },
      rotation: {
        set: vi.fn(),
        x: 0,
        y: 0,
        z: 0,
        toArray: vi.fn(() => [0, 0, 0]),
        fromArray: vi.fn(),
      },
      scale: {
        set: vi.fn(),
        x: 1,
        y: 1,
        z: 1,
        toArray: vi.fn(() => [1, 1, 1]),
        fromArray: vi.fn(),
      },
      userData: {},
      material: {},
      geometry: {},
      castShadow: false,
      receiveShadow: false,
    })),

    // Освещение
    AmbientLight: vi.fn().mockImplementation(() => ({
      intensity: 1,
      color: { setHex: vi.fn() },
    })),
    DirectionalLight: vi.fn().mockImplementation(() => ({
      position: { set: vi.fn() },
      intensity: 1,
      color: { setHex: vi.fn() },
      castShadow: false,
      shadow: {
        mapSize: { width: 2048, height: 2048 },
      },
    })),
    PointLight: vi.fn().mockImplementation(() => ({
      position: { set: vi.fn() },
      intensity: 1,
      color: { setHex: vi.fn() },
    })),

    // Хелперы
    GridHelper: vi.fn().mockImplementation(() => ({})),
    AxesHelper: vi.fn().mockImplementation(() => ({})),

    // Утилиты
    Color: vi.fn().mockImplementation(() => ({
      setHex: vi.fn(),
      getHex: vi.fn(),
      r: 1,
      g: 1,
      b: 1,
    })),
    Vector2: vi.fn().mockImplementation(() => ({
      x: 0,
      y: 0,
      set: vi.fn(),
    })),
    Vector3: vi.fn().mockImplementation(() => ({
      x: 0,
      y: 0,
      z: 0,
      set: vi.fn(),
      copy: vi.fn(),
      clone: vi.fn(),
    })),
    Raycaster: vi.fn().mockImplementation(() => ({
      setFromCamera: vi.fn(),
      intersectObjects: vi.fn(() => []),
    })),

    // Константы
    PCFSoftShadowMap: 1,
    DoubleSide: 2,
  };
});

// Мок для GSAP
vi.mock('gsap', () => {
  const mockTimeline = {
    to: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    fromTo: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    pause: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    restart: vi.fn().mockReturnThis(),
    reverse: vi.fn().mockReturnThis(),
    seek: vi.fn().mockReturnThis(),
    kill: vi.fn().mockReturnThis(),
    duration: vi.fn().mockReturnValue(1),
    progress: vi.fn().mockReturnValue(0.5),
  };

  return {
    default: {
      to: vi.fn().mockReturnValue(mockTimeline),
      from: vi.fn().mockReturnValue(mockTimeline),
      fromTo: vi.fn().mockReturnValue(mockTimeline),
      set: vi.fn().mockReturnValue(mockTimeline),
      timeline: vi.fn().mockReturnValue(mockTimeline),
      registerPlugin: vi.fn(),
    },
    to: vi.fn().mockReturnValue(mockTimeline),
    from: vi.fn().mockReturnValue(mockTimeline),
    fromTo: vi.fn().mockReturnValue(mockTimeline),
    set: vi.fn().mockReturnValue(mockTimeline),
    timeline: vi.fn().mockReturnValue(mockTimeline),
    registerPlugin: vi.fn(),
  };
});

// Мок для Lottie
vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: vi.fn().mockReturnValue({
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      destroy: vi.fn(),
      setSpeed: vi.fn(),
      setDirection: vi.fn(),
      goToAndStop: vi.fn(),
      goToAndPlay: vi.fn(),
    }),
    setQuality: vi.fn(),
  },
}));

// Мок для Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(),
    span: vi.fn(),
    button: vi.fn(),
  },
  AnimatePresence: vi.fn(),
  useAnimation: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  })),
}));

// Глобальные моки для веб-API
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Мок для requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn();

// Мок для localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
// @ts-ignore
global.localStorage = localStorageMock;

// Мок для sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
// @ts-ignore
global.sessionStorage = sessionStorageMock;

// Мок для fetch API
global.fetch = vi.fn();

// Мок для URL.createObjectURL
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Очистка после каждого теста
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});

// Настройка глобальных переменных для тестов
beforeAll(() => {
  // Установка размеров окна для тестов
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  });

  // Мок для matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});
