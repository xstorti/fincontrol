import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Data directory is in public/data for Next.js compatibility
const DATA_DIR = path.join(process.cwd(), 'public', 'data');

/**
 * Ensure data directory exists
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Get file path
 */
function getFilePath(filename: string): string {
  ensureDataDir();
  return path.join(DATA_DIR, filename);
}

/**
 * Read CSV file and return array of objects
 */
export function readCsv<T>(filename: string): T[] {
  try {
    const filePath = getFilePath(filename);
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.trim()) {
      return [];
    }

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    }) as T[];

    return records;
  } catch (error) {
    console.error(`Error reading CSV ${filename}:`, error);
    return [];
  }
}

/**
 * Write array of objects to CSV file
 */
export function writeCsv<T extends Record<string, any>>(
  filename: string,
  data: T[]
): void {
  try {
    if (data.length === 0) {
      const filePath = getFilePath(filename);
      fs.writeFileSync(filePath, '', 'utf-8');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Handle quotes and commas in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          })
          .join(',')
      ),
    ].join('\n');

    const filePath = getFilePath(filename);
    fs.writeFileSync(filePath, csvContent, 'utf-8');
  } catch (error) {
    console.error(`Error writing CSV ${filename}:`, error);
    throw error;
  }
}

/**
 * Append a single row to CSV file
 */
export function appendToCsv<T extends Record<string, any>>(
  filename: string,
  row: T
): void {
  try {
    const existing = readCsv<T>(filename);
    writeCsv<T>(filename, [...existing, row]);
  } catch (error) {
    console.error(`Error appending to CSV ${filename}:`, error);
    throw error;
  }
}

/**
 * Update a row in CSV (by matching id field)
 */
export function updateCsvRow<T extends Record<string, any>>(
  filename: string,
  id: string,
  updates: Partial<T>
): boolean {
  try {
    const data = readCsv<T>(filename);
    const index = data.findIndex((row) => row.id === id);

    if (index === -1) {
      return false;
    }

    data[index] = { ...data[index], ...updates };
    writeCsv<T>(filename, data);
    return true;
  } catch (error) {
    console.error(`Error updating CSV ${filename}:`, error);
    throw error;
  }
}

/**
 * Delete a row from CSV (by matching id field)
 */
export function deleteCsvRow<T extends Record<string, any>>(
  filename: string,
  id: string
): boolean {
  try {
    const data = readCsv<T>(filename);
    const filteredData = data.filter((row) => row.id !== id);

    if (filteredData.length === data.length) {
      return false; // Not found
    }

    writeCsv<T>(filename, filteredData);
    return true;
  } catch (error) {
    console.error(`Error deleting from CSV ${filename}:`, error);
    throw error;
  }
}

/**
 * Export data as JSON
 */
export function exportAsJson<T>(filename: string): string {
  try {
    const data = readCsv<T>(filename);
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error(`Error exporting JSON ${filename}:`, error);
    throw error;
  }
}

/**
 * Get raw CSV content
 */
export function getRawCsv(filename: string): string {
  try {
    const filePath = getFilePath(filename);
    if (!fs.existsSync(filePath)) {
      return '';
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading CSV ${filename}:`, error);
    return '';
  }
}
