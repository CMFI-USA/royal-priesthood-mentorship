// Utility to calculate which week we're currently in
// Program starts May 3, 2026 (Monday) and runs through June 27, 2026

export function getCurrentWeek(): number {
  const programStart = new Date(2026, 4, 3); // May 3, 2026 (0-indexed months)
  const today = new Date();
  
  // Calculate days since program start
  const timeDiff = today.getTime() - programStart.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  // Calculate week (0-6 days = week 1, 7-13 days = week 2, etc.)
  const currentWeek = Math.floor(daysDiff / 7) + 1;
  
  // Clamp to week 1-8
  if (currentWeek < 1) return 1;
  if (currentWeek > 8) return 8;
  
  return currentWeek;
}

export function getWeekStartDate(week: number): string {
  const programStart = new Date(2026, 4, 3);
  const weekStart = new Date(programStart);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  
  return weekStart.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function isWeekActive(week: number): boolean {
  const currentWeek = getCurrentWeek();
  return week === currentWeek;
}
