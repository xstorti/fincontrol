import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { readCsv } from '@/lib/csv';
import { calculateBalance } from '@/lib/kpi';
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

    const users = readCsv<User>('users.csv');

    const usersWithBalance: UserWithBalance[] = users.map((u) => ({
      ...u,
      saldo: calculateBalance(u.id),
    }));

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
