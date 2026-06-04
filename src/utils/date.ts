import {
  format,
  isToday,
  isYesterday,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';

export function formatDate(dateStr: string, fmt = 'MMM dd, yyyy'): string {
  const d = new Date(dateStr + 'T00:00:00');
  return format(d, fmt);
}

export function formatGroupDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE, MMM dd');
}

export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function monthLabel(month: string): string {
  const [year, mon] = month.split('-');
  const d = new Date(parseInt(year), parseInt(mon) - 1, 1);
  return format(d, 'MMMM yyyy');
}

export function daysInMonth(month: string): Date[] {
  const [year, mon] = month.split('-');
  const start = new Date(parseInt(year), parseInt(mon) - 1, 1);
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end });
}

export function prevMonth(month: string): string {
  const [year, mon] = month.split('-');
  const d = new Date(parseInt(year), parseInt(mon) - 2, 1);
  return format(d, 'yyyy-MM');
}

export function nextMonth(month: string): string {
  const [year, mon] = month.split('-');
  const d = new Date(parseInt(year), parseInt(mon), 1);
  return format(d, 'yyyy-MM');
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function monthFromDate(dateStr: string): string {
  return dateStr.substring(0, 7);
}
