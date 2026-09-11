import { format, differenceInDays, startOfDay, parseISO, isToday, isYesterday } from 'date-fns';

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function formatDurationLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatDateTime(isoString: string): string {
  const date = parseISO(isoString);
  if (isToday(date)) return `Today ${format(date, 'HH:mm')}`;
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
  return format(date, 'MMM d, HH:mm');
}

export function formatDate(isoString: string): string {
  const date = parseISO(isoString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function getTodayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getWeekKey(date: Date = new Date()): string {
  return format(date, "yyyy-'W'ww");
}

export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return format(date, 'yyyy-MM-dd');
}

export function getDateRange(days: number): { start: string; end: string } {
  return {
    start: getDaysAgo(days - 1),
    end: getTodayKey(),
  };
}

export function getStreakDays(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort().reverse();
  const today = getTodayKey();
  const yesterday = getDaysAgo(1);
  
  // Streak must include today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseISO(sorted[i - 1]);
    const curr = parseISO(sorted[i]);
    const diff = differenceInDays(prev, curr);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getStartOfDay(dateStr: string): string {
  return format(startOfDay(parseISO(dateStr)), "yyyy-MM-dd'T'HH:mm:ss");
}

export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}

export function secondsToMinutes(seconds: number): number {
  return Math.floor(seconds / 60);
}

export function getProgressPercentage(elapsed: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function getRelativeTime(isoString: string): string {
  const date = parseISO(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return format(date, 'MMM d');
}
