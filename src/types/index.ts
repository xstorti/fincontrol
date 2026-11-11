// User type
export interface User {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  tipo_usuario: 'admin' | 'user';
  criado_em: string;
  ativo: boolean;
}

// Credit/Saldo type
export interface Credit {
  id?: string;
  usuario_id: string;
  data_creditada: string;
  valor: number;
  descricao: string;
  admin_que_adicionou: string;
  criado_em: string;
}

// Transaction type
export interface Transaction {
  id: string;
  usuario_id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'despesa' | 'credito';
  criado_em: string;
  email_enviado: boolean;
}

// Email config
export interface EmailConfig {
  email: string;
  notifica_despesa: boolean;
  notifica_credito: boolean;
  ativo: boolean;
}

// KPI type
export interface KPI {
  saldo_atual: number;
  gasto_periodo: number;
  media_dia: number;
  periodo_dias: number;
}

// Auth payload
export interface AuthPayload {
  id: string;
  email: string;
  tipo_usuario: 'admin' | 'user';
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
