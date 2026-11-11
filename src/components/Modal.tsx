'use client';

import React, { ReactNode, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'secondary';
    loading?: boolean;
  }[];
}

export function Modal({ isOpen, title, children, onClose, actions = [] }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {actions.length > 0 && (
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
            {actions.map((action, index) => {
              const styles = {
                primary: 'bg-green-600 hover:bg-green-700 text-white',
                danger: 'bg-red-600 hover:bg-red-700 text-white',
                secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
              };

              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.loading}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    styles[action.variant || 'primary']
                  } ${action.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {action.loading && (
                    <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  )}
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
