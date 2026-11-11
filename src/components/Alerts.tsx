import Link from 'next/link';

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
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <span className="text-xl">❌</span>
        <div className="flex-1">
          <p className="font-semibold text-red-700">{message}</p>
          {details && <p className="text-red-600 text-sm mt-1">{details}</p>}
        </div>
      </div>

      {action && (
        <div className="mt-3 flex gap-2">
          {action.href ? (
            <Link href={action.href} className="text-red-600 hover:text-red-700 font-semibold text-sm underline">
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="text-red-600 hover:text-red-700 font-semibold text-sm underline"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
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
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-semibold text-gray-800 mb-1">{title}</p>
      <p className="text-gray-600 text-sm mb-4">{description}</p>

      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function SuccessAlert({
  message,
  details,
}: {
  message: string;
  details?: string;
}) {
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-start gap-3">
        <span className="text-xl">✅</span>
        <div>
          <p className="font-semibold text-green-700">{message}</p>
          {details && <p className="text-green-600 text-sm mt-1">{details}</p>}
        </div>
      </div>
    </div>
  );
}
