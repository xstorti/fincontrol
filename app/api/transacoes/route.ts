import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createErrorResponse } from '@/lib/middleware';
import { readCsv, appendToCsv, deleteCsvRow, readCsv as readAllCsv } from '@/lib/csv';
import { sendEmail, getTransactionEmailTemplate } from '@/lib/email';
import { calculateBalance, calculateKPI, getTransactionsByPeriod } from '@/lib/kpi';
import { generateId, formatDateToISO } from '@/lib/utils';
import { Transaction, User, ApiResponse } from '@/types';
import fs from 'fs';
import path from 'path';

// GET - List transactions
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req);

    if (!user || error) {
      return createErrorResponse('Não autenticado', 401);
    }

    const { searchParams } = new URL(req.url);
    const usuario_id = searchParams.get('usuario_id') || user.id;
    const dias = parseInt(searchParams.get('dias') || '30', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Verify access
    if (usuario_id !== user.id && user.tipo_usuario !== 'admin') {
      return createErrorResponse('Acesso negado', 403);
    }

    // Get transactions
    const transactions = getTransactionsByPeriod(usuario_id, dias).slice(0, limit);

    return NextResponse.json(
      {
        success: true,
        data: transactions,
      } as ApiResponse<Transaction[]>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return createErrorResponse('Erro ao obter transações', 500);
  }
}

// POST - Create transaction
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req);

    if (!user || error) {
      return createErrorResponse('Não autenticado', 401);
    }

    const body = await req.json();
    const { data, descricao, valor } = body;

    // Validate input
    if (!data || !descricao || !valor) {
      return createErrorResponse('Data, descrição e valor são obrigatórios', 400);
    }

    if (typeof valor !== 'number' || valor <= 0) {
      return createErrorResponse('Valor deve ser um número positivo', 400);
    }

    // Check if date is not in future
    const txDate = new Date(data);
    const now = new Date();
    if (txDate > now) {
      return createErrorResponse('Data não pode ser no futuro', 400);
    }

    // Create transaction
    const transaction: Transaction = {
      id: generateId(),
      usuario_id: user.id,
      data: data,
      descricao: descricao,
      valor: valor,
      tipo: 'despesa',
      criado_em: new Date().toISOString(),
      email_enviado: false,
    };

    // Save transaction
    appendToCsv<Transaction>('transactions.csv', transaction);

    // Get user details
    const users = readCsv<User>('users.csv');
    const usuario = users.find((u) => u.id === user.id);

    if (!usuario) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    // Calculate new balance
    const saldo_antes = calculateBalance(user.id) + valor; // Add back valor since we just subtracted
    const saldo_depois = calculateBalance(user.id);
    const kpi = calculateKPI(user.id, 7);

    // Read email config
    let emailDestinarios = ['admin@familia.com'];
    try {
      const configPath = path.join(process.cwd(), 'public', 'data', 'email_config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        emailDestinarios = config.destinatarios
          .filter((e: any) => e.notifica_despesa && e.ativo)
          .map((e: any) => e.email);
      }
    } catch (err) {
      console.warn('Could not read email config:', err);
    }

    // Send email notification
    const emailHtml = getTransactionEmailTemplate({
      usuario_nome: usuario.nome,
      data: data,
      descricao: descricao,
      valor: valor,
      saldo_antes: saldo_antes,
      saldo_depois: saldo_depois,
      gasto_periodo: kpi.gasto_periodo,
      media_dia: kpi.media_dia,
      dias: 7,
    });

    const emailResult = await sendEmail({
      to: emailDestinarios,
      subject: `Gasto registrado: ${descricao}`,
      html: emailHtml,
    });

    // Update transaction email_enviado flag
    if (emailResult.success) {
      const transactions = readCsv<Transaction>('transactions.csv');
      const idx = transactions.findIndex((t) => t.id === transaction.id);
      if (idx !== -1) {
        transactions[idx].email_enviado = true;
        const data_dir = path.join(process.cwd(), 'public', 'data');
        fs.writeFileSync(
          path.join(data_dir, 'transactions.csv'),
          transactionsToCsv(transactions),
          'utf-8'
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...transaction,
          saldo_depois,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create transaction error:', error);
    return createErrorResponse('Erro ao criar transação', 500);
  }
}

// Helper to convert transactions to CSV
function transactionsToCsv(transactions: Transaction[]): string {
  if (transactions.length === 0) return '';

  const headers = ['id', 'usuario_id', 'data', 'descricao', 'valor', 'tipo', 'criado_em', 'email_enviado'];
  const rows = [
    headers.join(','),
    ...transactions.map((t) =>
      [
        t.id,
        t.usuario_id,
        t.data,
        t.descricao,
        t.valor,
        t.tipo,
        t.criado_em,
        t.email_enviado,
      ]
        .map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v))
        .join(',')
    ),
  ];

  return rows.join('\n');
}
