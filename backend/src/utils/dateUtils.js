/**
 * Date utility functions matching frontend
 * CRITICAL: Weeks run Thursday to Wednesday (finance cycle)
 */

export function getCurrentWeekStart() {
  const today = new Date();
  const dayOfWeek = today.getDay();

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

export function getCurrentWeekEnd() {
  const weekStart = getCurrentWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return weekEnd;
}

export function getDaysInMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getDaysAccounted(date = new Date()) {
  return date.getDate();
}

export function calculatePacing(mtdRevenue, target, date = new Date()) {
  if (!target || target === 0) return 0;

  const daysAccounted = getDaysAccounted(date);
  const daysInMonth = getDaysInMonth(date);

  if (daysAccounted === 0) return 0;

  const pacing = (mtdRevenue / daysAccounted) * (daysInMonth / target) * 100;
  return pacing;
}
