/**
 * Date utility functions for quarter and month calculations
 */

/**
 * Get the previous quarter and year based on current date
 * @returns Object with quarter (Q1-Q4) and year (string)
 */
export const getPreviousQuarter = (): { quarter: string; year: string } => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  let previousQuarter: string;
  let previousYear: number;

  if (currentMonth >= 1 && currentMonth <= 3) {
    // Q1 - previous quarter is Q4 of last year
    previousQuarter = 'Q4';
    previousYear = currentYear - 1;
  } else if (currentMonth >= 4 && currentMonth <= 6) {
    // Q2 - previous quarter is Q1 of current year
    previousQuarter = 'Q1';
    previousYear = currentYear;
  } else if (currentMonth >= 7 && currentMonth <= 9) {
    // Q3 - previous quarter is Q2 of current year
    previousQuarter = 'Q2';
    previousYear = currentYear;
  } else {
    // Q4 - previous quarter is Q3 of current year
    previousQuarter = 'Q3';
    previousYear = currentYear;
  }

  return {
    quarter: previousQuarter,
    year: previousYear.toString(),
  };
};

/**
 * Get the previous month and year based on current date
 * @returns Object with month (1-12) and year (number)
 */
export const getPreviousMonth = (): { month: number; year: number } => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  let previousMonth: number;
  let previousYear: number;

  if (currentMonth === 1) {
    // January - previous month is December of last year
    previousMonth = 12;
    previousYear = currentYear - 1;
  } else {
    previousMonth = currentMonth - 1;
    previousYear = currentYear;
  }

  return {
    month: previousMonth,
    year: previousYear,
  };
};

/**
 * Get the months in a quarter
 * @param quarter - Quarter string (Q1, Q2, Q3, Q4)
 * @returns Array of month numbers (1-12) for that quarter
 */
export const getMonthsInQuarter = (quarter: string): number[] => {
  switch (quarter) {
    case 'Q1':
      return [1, 2, 3]; // January, February, March
    case 'Q2':
      return [4, 5, 6]; // April, May, June
    case 'Q3':
      return [7, 8, 9]; // July, August, September
    case 'Q4':
      return [10, 11, 12]; // October, November, December
    default:
      return [];
  }
};
