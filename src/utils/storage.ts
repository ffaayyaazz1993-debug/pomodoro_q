const STORAGE_KEY = 'pomodoro_app_data';

export function saveToStorage<T>(key: string, data: T): void {
  try {
    const existing = getAllData();
    existing[key] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const allData = getAllData();
    if (key in allData) {
      return allData[key] as T;
    }
    return defaultValue;
  } catch (e) {
    console.error('Failed to load from storage:', e);
    return defaultValue;
  }
}

export function getAllData(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse storage:', e);
    return {};
  }
}

export function saveAllData(data: Record<string, unknown>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save all data:', e);
  }
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear storage:', e);
  }
}

export function exportData(): string {
  const data = getAllData();
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (typeof data !== 'object' || data === null) return false;
    saveAllData(data);
    return true;
  } catch (e) {
    console.error('Failed to import data:', e);
    return false;
  }
}

export function exportToCSV(headers: string[], rows: (string | number | null)[][]): string {
  const escape = (val: string | number | null) => {
    if (val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const headerLine = headers.map(escape).join(',');
  const dataLines = rows.map(row => row.map(escape).join(','));
  return [headerLine, ...dataLines].join('\n');
}
