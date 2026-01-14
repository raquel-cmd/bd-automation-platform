/**
 * Date utility functions for BestReviews BD Platform
 * CRITICAL: Weeks run Thursday to Wednesday (finance cycle)
 */

/**
 * Get the start of the current finance week (Thursday)
 */
export function getCurrentWeekStart() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 4 = Thursday

  // Calculate days to subtract to get to Thursday
  // If today is Thu (4), offset = 0
  // If today is Fri (5), offset = 1
  // If today is Sat (6), offset = 2
  // If today is Sun (0), offset = 3
  // If today is Mon (1), offset = 4
  // If today is Tue (2), offset = 5
  // If today is Wed (3), offset = 6
  let offset;
  if (dayOfWeek >= 4) {
    offset = dayOfWeek - 4;
  } else {
    offset = dayOfWeek + 3;
  }

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - offset);
  weekStart.setHours(0, 0, 0, 0);

  return weekStart;
}

/**
 * Get the end of the current finance week (Wednesday)
 */
export function getCurrentWeekEnd() {
  const weekStart = getCurrentWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return weekEnd;
}

/**
 * Get the start of the current month
 */
export function getCurrentMonthStart() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

/**
 * Get the end of the current month
 */
export function getCurrentMonthEnd() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Get the number of days in the current month
 */
export function getDaysInMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Get the number of days accounted for (from start of month to today)
 */
export function getDaysAccounted(date = new Date()) {
  const today = new Date(date);
  return today.getDate();
}

/**
 * Calculate pacing percentage using straight-line formula
 * Formula: (MTD Revenue / Days Accounted) × Days in Month / Target × 100
 *
 * @param {number} mtdRevenue - Month-to-date revenue
 * @param {number} target - Monthly target
 * @param {Date} date - Optional date (defaults to today)
 * @returns {number} Pacing percentage
 */
export function calculatePacing(mtdRevenue, target, date = new Date()) {
  if (!target || target === 0) return 0;

  const daysAccounted = getDaysAccounted(date);
  const daysInMonth = getDaysInMonth(date);

  if (daysAccounted === 0) return 0;

  // (MTD Revenue / Days Accounted) × Days in Month / Target × 100
  const pacing = (mtdRevenue / daysAccounted) * (daysInMonth / target) * 100;

  return pacing;
}

/**
 * Format currency
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 0) {
  if (value === null || value === undefined) return '0%';

  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date as MMM DD, YYYY
 */
export function formatDate(date) {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format date range
 */
export function formatDateRange(startDate, endDate) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * Get month name
 */
export function getMonthName(date = new Date()) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
