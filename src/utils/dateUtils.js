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

/**
 * Get the start date of a finance week N weeks ago
 * @param {number} weeksAgo - Number of weeks back (0 = current week)
 */
export function getWeekStart(weeksAgo = 0) {
  const currentWeekStart = getCurrentWeekStart();
  const targetWeek = new Date(currentWeekStart);
  targetWeek.setDate(currentWeekStart.getDate() - (weeksAgo * 7));
  return targetWeek;
}

/**
 * Get the end date of a finance week N weeks ago
 * @param {number} weeksAgo - Number of weeks back (0 = current week)
 */
export function getWeekEnd(weeksAgo = 0) {
  const weekStart = getWeekStart(weeksAgo);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Get an array of the last N finance weeks
 * @param {number} count - Number of weeks to retrieve
 * @returns {Array} Array of week objects with start, end, and label
 */
export function getLastNWeeks(count = 5) {
  const weeks = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = getWeekStart(i);
    const end = getWeekEnd(i);
    weeks.push({
      start,
      end,
      label: formatWeekLabel(start, end),
      weeksAgo: i
    });
  }
  return weeks;
}

/**
 * Get an array of finance weeks in a range
 * @param {number} startWeeksAgo - Number of weeks back for start of range
 * @param {number} endWeeksAgo - Number of weeks back for end of range (0 = current week)
 * @returns {Array} Array of week objects with start, end, and label
 */
export function getWeekRange(startWeeksAgo, endWeeksAgo) {
  const weeks = [];
  // Ensure start is greater than or equal to end (start is further back in time)
  const start = Math.max(startWeeksAgo, endWeeksAgo);
  const end = Math.min(startWeeksAgo, endWeeksAgo);

  for (let i = start; i >= end; i--) {
    const weekStart = getWeekStart(i);
    const weekEnd = getWeekEnd(i);
    weeks.push({
      start: weekStart,
      end: weekEnd,
      label: formatWeekLabel(weekStart, weekEnd),
      weeksAgo: i
    });
  }
  return weeks;
}

/**
 * Format a week label (e.g., "Dec 26 - Jan 1" or "Jan 2-8")
 */
export function formatWeekLabel(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
}
