import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { isValidEmail } from '@/lib/utils';
import { EmailConfig, ApiResponse } from '@/types';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'public', 'data', 'email_config.json');

function ensureConfigFile(): { destinatarios: EmailConfig[] } {
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig = { destinatarios: [] };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }

  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return { destinatarios: [] };
  }
}

function saveConfig(config: any): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// GET - List email recipients
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const config = ensureConfigFile();

    return NextResponse.json(
      {
        success: true,
        data: config.destinatarios,
      } as ApiResponse<EmailConfig[]>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get emails error:', error);
    return createErrorResponse('Erro ao listar emails', 500);
  }
}

// POST - Add email recipient
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const body = await req.json();
    const { email, notifica_despesa, notifica_credito } = body;

    // Validate input
    if (!email) {
      return createErrorResponse('Email é obrigatório', 400);
    }

    if (!isValidEmail(email)) {
      return createErrorResponse('Email inválido', 400);
    }

    const config = ensureConfigFile();

    // Check if email already exists
    if (config.destinatarios.some((e) => e.email === email)) {
      return createErrorResponse('Email já cadastrado', 400);
    }

    // Add email
    const newEmail: EmailConfig = {
      email,
      notifica_despesa: notifica_despesa !== false,
      notifica_credito: notifica_credito !== false,
      ativo: true,
    };

    config.destinatarios.push(newEmail);
    saveConfig(config);

    return NextResponse.json(
      {
        success: true,
        data: newEmail,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Add email error:', error);
    return createErrorResponse('Erro ao adicionar email', 500);
  }
}

// PUT - Update email preferences
export async function PUT(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const body = await req.json();
    const { email, notifica_despesa, notifica_credito } = body;

    if (!email) {
      return createErrorResponse('Email é obrigatório', 400);
    }

    const config = ensureConfigFile();
    const emailIndex = config.destinatarios.findIndex((e) => e.email === email);

    if (emailIndex === -1) {
      return createErrorResponse('Email não encontrado', 404);
    }

    // Update preferences
    if (typeof notifica_despesa === 'boolean') {
      config.destinatarios[emailIndex].notifica_despesa = notifica_despesa;
    }

    if (typeof notifica_credito === 'boolean') {
      config.destinatarios[emailIndex].notifica_credito = notifica_credito;
    }

    saveConfig(config);

    return NextResponse.json(
      {
        success: true,
        data: config.destinatarios[emailIndex],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update email error:', error);
    return createErrorResponse('Erro ao atualizar email', 500);
  }
}

// DELETE - Remove email recipient
export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return createErrorResponse('Email é obrigatório', 400);
    }

    const config = ensureConfigFile();
    const initialLength = config.destinatarios.length;

    config.destinatarios = config.destinatarios.filter((e) => e.email !== email);

    if (config.destinatarios.length === initialLength) {
      return createErrorResponse('Email não encontrado', 404);
    }

    saveConfig(config);

    return NextResponse.json(
      {
        success: true,
        message: 'Email removido com sucesso',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete email error:', error);
    return createErrorResponse('Erro ao remover email', 500);
  }
}
