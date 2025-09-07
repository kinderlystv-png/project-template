// Удалены типы для UI компонентов (Calculator, Product, Scene3D)

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
