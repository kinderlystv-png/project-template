// Типы для калькуляторов
export interface Calculator {
  id: string;
  name: string;
  description: string;
  category: CalculatorCategory;
  inputs: CalculatorInput[];
  calculate: (values: Record<string, number>) => CalculatorResult;
}

export interface CalculatorInput {
  id: string;
  label: string;
  type: 'number' | 'select' | 'range';
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string | number; label: string }>;
  defaultValue?: number | string;
  unit?: string;
}

export interface CalculatorResult {
  value: number;
  unit?: string;
  formula?: string;
  breakdown?: Array<{ label: string; value: number; unit?: string }>;
}

export type CalculatorCategory =
  | 'financial'
  | 'engineering'
  | 'mathematical'
  | 'physics'
  | 'chemistry'
  | 'construction';

// Типы для товаров
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: ProductImage[];
  category: ProductCategory;
  tags: string[];
  specifications: ProductSpecification[];
  availability: ProductAvailability;
  rating: ProductRating;
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductSpecification {
  name: string;
  value: string;
  unit?: string;
  category: string;
}

export interface ProductAvailability {
  inStock: boolean;
  quantity: number;
  location?: string;
  estimatedDelivery?: Date;
}

export interface ProductRating {
  average: number;
  count: number;
  distribution: Record<number, number>; // stars -> count
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  attributes: Record<string, string>; // color, size, etc.
  availability: ProductAvailability;
}

export type ProductCategory = string;

// Типы для 3D конструктора
export interface Scene3D {
  id: string;
  name: string;
  objects: Object3D[];
  camera: Camera3D;
  lighting: Lighting3D;
  environment: Environment3D;
  metadata: SceneMetadata;
}

export interface Object3D {
  id: string;
  name: string;
  type: Object3DType;
  geometry: Geometry3D;
  material: Material3D;
  transform: Transform3D;
  animations?: Animation3D[];
  children?: Object3D[];
}

export interface Transform3D {
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Geometry3D {
  type: GeometryType;
  parameters: Record<string, number>;
  vertices?: number[];
  faces?: number[];
  uvs?: number[];
  normals?: number[];
}

export interface Material3D {
  type: MaterialType;
  color: string;
  opacity: number;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  map?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
}

export interface Camera3D {
  type: 'perspective' | 'orthographic';
  position: Vector3D;
  target: Vector3D;
  fov?: number;
  near: number;
  far: number;
  zoom: number;
}

export interface Lighting3D {
  ambient: LightSource;
  directional: LightSource[];
  point: PointLight[];
  spot: SpotLight[];
}

export interface LightSource {
  color: string;
  intensity: number;
}

export interface PointLight extends LightSource {
  position: Vector3D;
  distance: number;
  decay: number;
}

export interface SpotLight extends PointLight {
  target: Vector3D;
  angle: number;
  penumbra: number;
}

export interface Environment3D {
  background: string | 'skybox';
  fog?: {
    color: string;
    near: number;
    far: number;
  };
  skybox?: {
    textures: string[];
  };
}

export interface Animation3D {
  id: string;
  name: string;
  duration: number;
  loop: boolean;
  keyframes: Keyframe3D[];
}

export interface Keyframe3D {
  time: number;
  property: string;
  value: any;
  easing?: string;
}

export interface SceneMetadata {
  version: string;
  created: Date;
  modified: Date;
  author: string;
  description: string;
  tags: string[];
}

export type Object3DType = 'mesh' | 'group' | 'light' | 'camera' | 'helper';

export type GeometryType = 'box' | 'sphere' | 'cylinder' | 'plane' | 'cone' | 'torus' | 'custom';

export type MaterialType = 'basic' | 'lambert' | 'phong' | 'standard' | 'physical';

// Типы для анимаций
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  repeat?: number;
  yoyo?: boolean;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

export interface LottieConfig {
  path?: string;
  animationData?: any;
  loop: boolean;
  autoplay: boolean;
  renderer: 'svg' | 'canvas' | 'html';
}

// Общие утилитарные типы
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: ToastAction[];
}

export interface ToastAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}

export interface Modal {
  id: string;
  title: string;
  content: any;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  actions?: ModalAction[];
}

export interface ModalAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}
