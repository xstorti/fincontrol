import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getTransactionEmailTemplate } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, usuario_nome = 'Teste', valor = 150.00 } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email não fornecido' }, { status: 400 });
    }

    // Test email template
    const emailHtml = getTransactionEmailTemplate({
      usuario_nome,
      data: new Date().toISOString().split('T')[0],
      descricao: '🧪 Email de Teste - FinControl',
      valor,
      saldo_antes: 500.00,
      saldo_depois: 500.00 - valor,
      gasto_periodo: valor,
      media_dia: valor / 7,
      dias: 7,
    });

    // Send test email
    const result = await sendEmail({
      to: email,
      subject: '🧪 [TESTE] Notificação de Despesa - FinControl',
      html: emailHtml,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: 'Erro ao enviar email de teste',
          details: {
            email,
            api_key_configured: !!process.env.RESEND_API_KEY,
            api_key_starts_with: process.env.RESEND_API_KEY?.substring(0, 8),
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '✅ Email de teste enviado com sucesso!',
      details: {
        to: email,
        template: 'transaction',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Erro ao enviar email de teste',
      },
      { status: 500 }
    );
  }
}
