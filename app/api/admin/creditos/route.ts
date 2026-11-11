import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { readCsv, appendToCsv } from '@/lib/csv';
import { sendEmail, getCreditEmailTemplate } from '@/lib/email';
import { calculateBalance } from '@/lib/kpi';
import { generateId } from '@/lib/utils';
import { User, Credit, ApiResponse } from '@/types';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const body = await req.json();
    const { usuario_id, valor, descricao } = body;

    // Validate input
    if (!usuario_id || !valor || !descricao) {
      return createErrorResponse('usuário_id, valor e descrição são obrigatórios', 400);
    }

    if (typeof valor !== 'number' || valor <= 0) {
      return createErrorResponse('Valor deve ser um número positivo', 400);
    }

    // Get user
    const users = readCsv<User>('users.csv');
    const targetUser = users.find((u) => u.id === usuario_id);

    if (!targetUser) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    // Get admin
    const admin = users.find((u) => u.id === user.id);

    if (!admin) {
      return createErrorResponse('Admin não encontrado', 404);
    }

    // Create credit
    const credit: Credit = {
      usuario_id,
      data_creditada: new Date().toISOString().split('T')[0],
      valor,
      descricao,
      admin_que_adicionou: user.id,
      criado_em: new Date().toISOString(),
    };

    // Save credit
    appendToCsv<Credit>('credits.csv', credit);

    // Calculate new balance
    const saldo_novo = calculateBalance(usuario_id);

    // Send email notification
    const emailHtml = getCreditEmailTemplate({
      usuario_nome: targetUser.nome,
      valor,
      descricao,
      saldo_novo,
      admin_nome: admin.nome,
    });

    // Get email config
    let emailDestinarios = [targetUser.email];
    try {
      const configPath = path.join(process.cwd(), 'public', 'data', 'email_config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const notifEmails = config.destinatarios
          .filter((e: any) => e.notifica_credito && e.ativo)
          .map((e: any) => e.email);
        emailDestinarios = [...new Set([...emailDestinarios, ...notifEmails])];
      }
    } catch (err) {
      console.warn('Could not read email config:', err);
    }

    // Send email
    await sendEmail({
      to: emailDestinarios,
      subject: `Crédito adicionado: ${descricao}`,
      html: emailHtml,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...credit,
          saldo_novo,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Add credit error:', error);
    return createErrorResponse('Erro ao adicionar crédito', 500);
  }
}
