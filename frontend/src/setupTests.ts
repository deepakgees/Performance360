/**
 * Jest setup file for React Testing Library
 * This file is automatically loaded by react-scripts before running tests
 */

// Add custom jest matchers from jest-dom
// Note: @testing-library/jest-dom is included with react-scripts
import '@testing-library/jest-dom';

// Mock window.matchMedia (used by some components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.alert
window.alert = jest.fn();

// Mock ResizeObserver (used by Recharts ResponsiveContainer in jsdom)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Suppress known third-party and test-environment console noise (tests still pass)
const originalError = console.error;
const originalWarn = console.warn;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : String(args[0]);
  if (
    msg.includes('ReactDOMTestUtils.act') ||
    msg.includes('was not wrapped in act(...)')
  ) {
    return;
  }
  originalError.apply(console, args);
};
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : String(args[0]);
  if (
    msg.includes('React Router Future Flag') ||
    msg.includes('v7_startTransition') ||
    msg.includes('v7_relativeSplatPath') ||
    msg.includes('width(0) and height(0) of chart')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};
