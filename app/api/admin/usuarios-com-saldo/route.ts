import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { User, ApiResponse } from '@/types';

interface UserWithBalance extends User {
  saldo: number;
}

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*');

    if (usersError || !users) {
      return createErrorResponse('Erro ao listar usuários', 500);
    }

    // Calculate balance for each user
    const usersWithBalance: UserWithBalance[] = await Promise.all(
      users.map(async (u) => {
        // Get credits
        const { data: credits } = await supabaseAdmin
          .from('credits')
          .select('valor')
          .eq('usuario_id', u.id);

        // Get transactions (expenses only)
        const { data: transactions } = await supabaseAdmin
          .from('transactions')
          .select('valor')
          .eq('usuario_id', u.id)
          .eq('tipo', 'despesa');

        const totalCredito = (credits || []).reduce((sum, c) => sum + (c.valor || 0), 0);
        const totalGasto = (transactions || []).reduce((sum, t) => sum + (t.valor || 0), 0);
        const saldo = totalCredito - totalGasto;

        return {
          ...u,
          saldo,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: usersWithBalance,
      } as ApiResponse<UserWithBalance[]>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get users with balance error:', error);
    return createErrorResponse('Erro ao listar usuários', 500);
  }
}
