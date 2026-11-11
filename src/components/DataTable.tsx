'use client';

import { ReactNode } from 'react';
import { SkeletonList } from './Loading';

interface DataTableProps {
  loading: boolean;
  error?: string;
  empty?: boolean;
  emptyMessage?: string;
  columns: {
    label: string;
    key: string;
    width?: string;
  }[];
  data: any[];
  renderRow: (item: any, index: number) => ReactNode;
}

export function DataTable({
  loading,
  error,
  empty,
  emptyMessage = 'Nenhum dado encontrado',
  columns,
  data,
  renderRow,
}: DataTableProps) {
  if (loading) {
    return <SkeletonList count={5} />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-700 font-semibold">❌ {error}</p>
      </div>
    );
  }

  if (empty || data.length === 0) {
    return (
      <div className="p-8 bg-white rounded-lg shadow text-center border border-gray-200">
        <p className="text-gray-500 text-sm">📭 {emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                {renderRow(item, index)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 p-4">
        {data.map((item, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            {renderRow(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
