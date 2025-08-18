import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn, // キャッシュを無効化してテスト実行
  revalidateTag: vi.fn(),
}));

// Mock server-only (for service tests)
vi.mock('server-only', () => ({}));

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// ========================================
// DOM API Mocks
// ========================================

// Mock hasPointerCapture for Radix UI
Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
  value: vi.fn(),
});

// Mock scrollIntoView for Radix UI Select
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
});

// Mock PointerEvent for Radix UI components
// @ts-expect-error PointerEventはMouseEventで代替可能
window.PointerEvent = MouseEvent;

// Mock matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

// Mock ResizeObserver for responsive components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for lazy loading components
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));
