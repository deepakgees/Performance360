/**
 * Unit tests for dateUtils utility functions
 */

import {
  getPreviousQuarter,
  getPreviousMonth,
  getMonthsInQuarter,
} from './dateUtils';

describe('dateUtils', () => {
  describe('getPreviousQuarter', () => {
    it('should return Q4 of previous year when current month is January (Q1)', () => {
      // Mock current date to January 15, 2024
      const mockDate = new Date(2024, 0, 15); // Month is 0-indexed
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const result = getPreviousQuarter();
      expect(result.quarter).toBe('Q4');
      expect(result.year).toBe('2023');

      jest.useRealTimers();
    });

    it('should return Q1 of current year when current month is April (Q2)', () => {
      const mockDate = new Date(2024, 3, 15); // April
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const result = getPreviousQuarter();
      expect(result.quarter).toBe('Q1');
      expect(result.year).toBe('2024');

      jest.useRealTimers();
    });

    it('should return Q2 of current year when current month is July (Q3)', () => {
      const mockDate = new Date(2024, 6, 15); // July
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const result = getPreviousQuarter();
      expect(result.quarter).toBe('Q2');
      expect(result.year).toBe('2024');

      jest.useRealTimers();
    });

    it('should return Q3 of current year when current month is October (Q4)', () => {
      const mockDate = new Date(2024, 9, 15); // October
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const result = getPreviousQuarter();
      expect(result.quarter).toBe('Q3');
      expect(result.year).toBe('2024');

      jest.useRealTimers();
    });

    it('should handle edge case of March (end of Q1)', () => {
      const mockDate = new Date(2024, 2, 31); // March 31
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const result = getPreviousQuarter();
      expect(result.quarter).toBe('Q4');
      expect(result.year).toBe('2023');

      jest.useRealTimers();
    });
  });

  describe('getPreviousMonth', () => {
    it('should return December of previous year when current month is January', () => {
      const mockDate = new Date(2024, 0, 15); // January
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const result = getPreviousMonth();
      expect(result.month).toBe(12);
      expect(result.year).toBe(2023);

      jest.useRealTimers();
    });

    it('should return previous month of current year for other months', () => {
      const mockDate = new Date(2024, 5, 15); // June
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const result = getPreviousMonth();
      expect(result.month).toBe(5);
      expect(result.year).toBe(2024);

      jest.useRealTimers();
    });

    it('should handle February correctly', () => {
      const mockDate = new Date(2024, 1, 15); // February
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const result = getPreviousMonth();
      expect(result.month).toBe(1);
      expect(result.year).toBe(2024);

      jest.useRealTimers();
    });
  });

  describe('getMonthsInQuarter', () => {
    it('should return correct months for Q1', () => {
      const result = getMonthsInQuarter('Q1');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return correct months for Q2', () => {
      const result = getMonthsInQuarter('Q2');
      expect(result).toEqual([4, 5, 6]);
    });

    it('should return correct months for Q3', () => {
      const result = getMonthsInQuarter('Q3');
      expect(result).toEqual([7, 8, 9]);
    });

    it('should return correct months for Q4', () => {
      const result = getMonthsInQuarter('Q4');
      expect(result).toEqual([10, 11, 12]);
    });

    it('should return empty array for invalid quarter', () => {
      const result = getMonthsInQuarter('Q5');
      expect(result).toEqual([]);
    });

    it('should return empty array for invalid input', () => {
      const result = getMonthsInQuarter('INVALID');
      expect(result).toEqual([]);
    });
  });
});
