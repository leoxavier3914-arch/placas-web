'use client';

import { useState } from 'react';

interface Props {
  message: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  confirmText?: string;
}

export default function ConfirmDeleteModal({ message, onConfirm, onCancel, confirmText = 'Confirmar' }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="w-80 space-y-3 rounded bg-white p-4">
        <p>{message}</p>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="rounded border px-3 py-2" disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="rounded bg-red-600 px-4 py-2 text-white"
            disabled={loading}
          >
            {loading ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

