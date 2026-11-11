import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { comparePassword, generateToken } from '@/lib/auth';
import { isValidEmail } from '@/lib/utils';
import { createErrorResponse, createAuthResponse } from '@/lib/middleware';
import { User, ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, senha } = body;

    // Validate input
    if (!email || !senha) {
      return createErrorResponse('Email e senha são obrigatórios', 400);
    }

    if (!isValidEmail(email)) {
      return createErrorResponse('Email inválido', 400);
    }

    // Get users from Supabase
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('ativo', true);

    if (error || !users || users.length === 0) {
      return createErrorResponse('Email ou senha incorretos', 401);
    }

    const user = users[0];

    // Verify password
    const passwordMatch = await comparePassword(senha, user.senha_hash);

    if (!passwordMatch) {
      return createErrorResponse('Email ou senha incorretos', 401);
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      tipo_usuario: user.tipo_usuario,
    });

    // Return success with token in cookie
    const response = NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipo_usuario: user.tipo_usuario,
        },
      } as ApiResponse<any>,
      { status: 200 }
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('Erro ao fazer login', 500);
  }
}
