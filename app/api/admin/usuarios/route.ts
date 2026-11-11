import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { readCsv, writeCsv, appendToCsv, updateCsvRow } from '@/lib/csv';
import { hashPassword, generateTemporaryPassword } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import { isValidEmail } from '@/lib/utils';
import { User, ApiResponse } from '@/types';

// GET - List all users
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const users = readCsv<User>('users.csv');

    return NextResponse.json(
      {
        success: true,
        data: users,
      } as ApiResponse<User[]>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('List users error:', error);
    return createErrorResponse('Erro ao listar usuários', 500);
  }
}

// POST - Create new user
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const body = await req.json();
    const { nome, email, tipo_usuario } = body;

    // Validate input
    if (!nome || !email || !tipo_usuario) {
      return createErrorResponse('Nome, email e tipo são obrigatórios', 400);
    }

    if (!isValidEmail(email)) {
      return createErrorResponse('Email inválido', 400);
    }

    // Check if email already exists
    const users = readCsv<User>('users.csv');
    if (users.some((u) => u.email === email)) {
      return createErrorResponse('Email já cadastrado', 400);
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const senhaHash = await hashPassword(tempPassword);

    // Create new user
    const newUser: User = {
      id: generateId(),
      nome,
      email,
      senha_hash: senhaHash,
      tipo_usuario,
      criado_em: new Date().toISOString(),
      ativo: true,
    };

    // Save user
    appendToCsv<User>('users.csv', newUser);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newUser,
          senha_hash: undefined,
          temp_password: tempPassword,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create user error:', error);
    return createErrorResponse('Erro ao criar usuário', 500);
  }
}
