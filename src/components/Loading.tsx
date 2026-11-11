'use client';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-neutral-200 dark:border-neutral-700 border-t-primary-500 mx-auto mb-6"></div>
        <p className="text-neutral-600 dark:text-neutral-400 text-lg font-medium">Carregando...</p>
      </div>
    </div>
  );
}

export function LoadingButton({
  loading,
  children,
  ...props
}: {
  loading: boolean;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <button
      disabled={loading}
      {...props}
      className={`flex items-center justify-center gap-2 ${props.className || ''}`}
    >
      {loading && (
        <div className="animate-spin w-4 h-4 border-2 border-white dark:border-neutral-800 border-t-transparent rounded-full"></div>
      )}
      {children}
    </button>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded-md ${className}`}
    />
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
