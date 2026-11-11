import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: EmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email not sent.');
      return { success: false, error: 'Email service not configured' };
    }

    const response = await resend.emails.send({
      from: process.env.ADMIN_EMAIL || 'noreply@fincontrol.com',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    });

    if (response.error) {
      console.error('Resend error:', response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Email template for transaction notification
 */
export function getTransactionEmailTemplate(data: {
  usuario_nome: string;
  data: string;
  descricao: string;
  valor: number;
  saldo_antes: number;
  saldo_depois: number;
  gasto_periodo: number;
  media_dia: number;
  dias: number;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333;">💸 Gasto Registrado</h1>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Usuário:</strong> ${data.usuario_nome}</p>
        <p><strong>Data:</strong> ${new Date(data.data).toLocaleDateString('pt-BR')}</p>
        <p><strong>Descrição:</strong> ${data.descricao}</p>
        <p style="font-size: 24px; color: #d32f2f;"><strong>Valor: R$ ${data.valor.toFixed(2)}</strong></p>
      </div>

      <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Saldo Anterior:</strong> R$ ${data.saldo_antes.toFixed(2)}</p>
        <p style="font-size: 20px; color: ${data.saldo_depois >= 0 ? '#2e7d32' : '#d32f2f'};"><strong>Saldo Atual: R$ ${data.saldo_depois.toFixed(2)}</strong></p>
      </div>

      <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Gasto em ${data.dias} dias:</strong> R$ ${data.gasto_periodo.toFixed(2)}</p>
        <p><strong>Média por dia:</strong> R$ ${data.media_dia.toFixed(2)}</p>
      </div>

      <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
        FinControl © ${new Date().getFullYear()} - Controle Financeiro Familiar
      </p>
    </div>
  `;
}

/**
 * Email template for credit notification
 */
export function getCreditEmailTemplate(data: {
  usuario_nome: string;
  valor: number;
  descricao: string;
  saldo_novo: number;
  admin_nome: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333;">💰 Crédito Adicionado</h1>
      
      <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Usuário:</strong> ${data.usuario_nome}</p>
        <p style="font-size: 20px; color: #2e7d32;"><strong>Crédito: R$ ${data.valor.toFixed(2)}</strong></p>
        <p><strong>Descrição:</strong> ${data.descricao}</p>
      </div>

      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 18px; color: ${data.saldo_novo >= 0 ? '#2e7d32' : '#d32f2f'};"><strong>Saldo Atual: R$ ${data.saldo_novo.toFixed(2)}</strong></p>
        <p><strong>Adicionado por:</strong> ${data.admin_nome}</p>
      </div>

      <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
        FinControl © ${new Date().getFullYear()} - Controle Financeiro Familiar
      </p>
    </div>
  `;
}
