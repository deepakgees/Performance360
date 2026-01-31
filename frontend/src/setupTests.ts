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
