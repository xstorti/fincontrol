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
 * Initialize default data
 */
function initializeDefaultData(): void {
  const usersPath = getFilePath('users.csv');
  
  if (!fs.existsSync(usersPath)) {
    const usersData = `id,nome,email,senha_hash,tipo_usuario,criado_em,ativo
1,Pai,pai@familia.com,$2b$10$ykD0fw1U/L1sZGXy.D8Wy.aI9.vWqM1Y8yYvNqSJxZK9OJzGhAZsm,admin,2026-01-01T00:00:00Z,true
2,Mãe,mae@familia.com,$2b$10$XChpaRCtA4Gv7FfLKnZXDu0HkW2VyKzH8pJ.QzN9zGh7KcZvZ7J9C,admin,2026-01-01T00:00:00Z,true
3,Filha,filha@familia.com,$2b$10$hDJGX0gck2.N5T1QzU6p.OzW8iE7R9Q3M1L5V4S7P8X2B9C1D4E5,user,2026-01-01T00:00:00Z,true`;
    
    fs.writeFileSync(usersPath, usersData, 'utf-8');
  }

  const creditsPath = getFilePath('credits.csv');
  if (!fs.existsSync(creditsPath)) {
    const creditsData = `usuario_id,data_creditada,valor,descricao,admin_que_adicionou,criado_em
3,2026-01-01,10000.00,Mesada Inicial,1,2026-01-01T00:00:00Z`;
    fs.writeFileSync(creditsPath, creditsData, 'utf-8');
  }

  const transactionsPath = getFilePath('transactions.csv');
  if (!fs.existsSync(transactionsPath)) {
    const transactionsData = `id,usuario_id,data,descricao,valor,tipo,criado_em,email_enviado
1,3,2026-01-01,Lanche,45.50,despesa,2026-01-01T00:00:00Z,false`;
    fs.writeFileSync(transactionsPath, transactionsData, 'utf-8');
  }

  const emailConfigPath = getFilePath('email_config.json');
  if (!fs.existsSync(emailConfigPath)) {
    const emailConfig = {
      destinatarios: [
        {
          email: 'pai@familia.com',
          notifica_despesa: true,
          notifica_credito: true,
          ativo: true,
        },
        {
          email: 'mae@familia.com',
          notifica_despesa: true,
          notifica_credito: true,
          ativo: true,
        },
      ],
    };
    fs.writeFileSync(emailConfigPath, JSON.stringify(emailConfig, null, 2), 'utf-8');
  }
}

/**
 * Read CSV file and return array of objects
 */
export function readCsv<T>(filename: string): T[] {
  try {
    initializeDefaultData();
    
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
