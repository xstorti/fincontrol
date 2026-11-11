import { NextRequest, NextResponse } from 'next/server';
import { readCsv } from '@/lib/csv';
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

    // Get users from CSV
    const users = readCsv<User>('users.csv');
    const user = users.find((u) => u.email === email && u.ativo);

    if (!user) {
      return createErrorResponse('Email ou senha incorretos', 401);
    }

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
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return createErrorResponse('Erro ao fazer login', 500);
  }
}
