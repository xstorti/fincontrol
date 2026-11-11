import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword, generateTemporaryPassword } from '@/lib/auth';
import { isValidEmail } from '@/lib/utils';
import { User, ApiResponse } from '@/types';

// GET - List all users
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const { data: users, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*');

    if (dbError) {
      console.error('DB error:', dbError);
      return createErrorResponse('Erro ao listar usuários', 500);
    }

    return NextResponse.json(
      {
        success: true,
        data: users || [],
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
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Check email error:', checkError);
      return createErrorResponse('Erro ao verificar email', 500);
    }

    if (existingUser) {
      return createErrorResponse('Email já cadastrado', 400);
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const senhaHash = await hashPassword(tempPassword);

    // Create new user in Supabase
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          nome,
          email,
          senha_hash: senhaHash,
          tipo_usuario,
          ativo: true,
        },
      ])
      .select();

    if (insertError || !newUser || newUser.length === 0) {
      console.error('Insert error:', insertError);
      return createErrorResponse('Erro ao criar usuário', 500);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUser[0].id,
          nome: newUser[0].nome,
          email: newUser[0].email,
          tipo_usuario: newUser[0].tipo_usuario,
          criado_em: newUser[0].criado_em,
          ativo: newUser[0].ativo,
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
