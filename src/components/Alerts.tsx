'use client';

import Link from 'next/link';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  details?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function ErrorAlert({ message, details, action }: ErrorAlertProps) {
  return (
    <div className="p-4 mb-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700/50 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-danger-600 dark:text-danger-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-danger-700 dark:text-danger-600">{message}</p>
          {details && <p className="text-danger-600 dark:text-danger-500 text-sm mt-1">{details}</p>}
        </div>
      </div>

      {action && (
        <div className="mt-3 flex gap-2">
          {action.href ? (
            <Link href={action.href} className="text-danger-600 dark:text-danger-500 hover:text-danger-700 dark:hover:text-danger-400 font-semibold text-sm underline">
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="text-danger-600 dark:text-danger-500 hover:text-danger-700 dark:hover:text-danger-400 font-semibold text-sm underline"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="p-4 mb-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700/50 rounded-lg flex gap-3">
      <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-500 flex-shrink-0 mt-0.5" />
      <p className="font-semibold text-success-700 dark:text-success-600">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon = '📭',
  title = 'Nenhum dado',
  description = 'Ainda não há nada para mostrar aqui',
  action,
}: {
  icon?: string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md dark:shadow-dark-md p-8 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{title}</p>
      <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">{description}</p>

      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-block px-6 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}
