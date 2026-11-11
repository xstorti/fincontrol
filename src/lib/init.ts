import { writeCsv } from './csv';
import { hashPassword } from './auth';
import { User, Credit, Transaction, EmailConfig } from '@/types';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

/**
 * Initialize sample data for first run
 */
export async function initializeSampleData(): Promise<void> {
  try {
    // Check if data already exists
    if (
      fs.existsSync(path.join(DATA_DIR, 'users.csv')) &&
      fs.existsSync(path.join(DATA_DIR, 'credits.csv'))
    ) {
      console.log('Data already initialized');
      return;
    }

    // Ensure directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Create sample users
    const adminPassword = await hashPassword('admin123');
    const userPassword = await hashPassword('user123');

    const users: User[] = [
      {
        id: '1',
        nome: 'Pai',
        email: 'pai@familia.com',
        senha_hash: adminPassword,
        tipo_usuario: 'admin',
        criado_em: new Date().toISOString(),
        ativo: true,
      },
      {
        id: '2',
        nome: 'Mãe',
        email: 'mae@familia.com',
        senha_hash: adminPassword,
        tipo_usuario: 'admin',
        criado_em: new Date().toISOString(),
        ativo: true,
      },
      {
        id: '3',
        nome: 'Filha',
        email: 'filha@familia.com',
        senha_hash: userPassword,
        tipo_usuario: 'user',
        criado_em: new Date().toISOString(),
        ativo: true,
      },
    ];

    // Create sample credits
    const credits: Credit[] = [
      {
        usuario_id: '3',
        data_creditada: new Date().toISOString().split('T')[0],
        valor: 10000,
        descricao: 'Mesada inicial',
        admin_que_adicionou: '1',
        criado_em: new Date().toISOString(),
      },
    ];

    // Create sample transactions
    const transactions: Transaction[] = [
      {
        id: '1',
        usuario_id: '3',
        data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        descricao: 'Lanche na escola',
        valor: 45.5,
        tipo: 'despesa',
        criado_em: new Date().toISOString(),
        email_enviado: true,
      },
      {
        id: '2',
        usuario_id: '3',
        data: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        descricao: 'Cinema',
        valor: 35,
        tipo: 'despesa',
        criado_em: new Date().toISOString(),
        email_enviado: true,
      },
    ];

    // Create email config
    const emailConfig: { destinatarios: EmailConfig[] } = {
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

    // Write CSV files
    writeCsv<User>('users.csv', users);
    writeCsv<Credit>('credits.csv', credits);
    writeCsv<Transaction>('transactions.csv', transactions);

    // Write email config as JSON
    fs.writeFileSync(
      path.join(DATA_DIR, 'email_config.json'),
      JSON.stringify(emailConfig, null, 2),
      'utf-8'
    );

    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
}

/**
 * Initialize data on app startup (server-side only)
 */
export async function setupDataOnStartup(): Promise<void> {
  // Only run in server-side
  if (typeof window !== 'undefined') {
    return;
  }

  try {
    await initializeSampleData();
  } catch (error) {
    console.error('Failed to setup data:', error);
  }
}
