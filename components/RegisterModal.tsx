'use client';

import { useState } from 'react';
import { parseJsonSafe } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Props {
  plate: string;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export default function RegisterModal({ plate, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    setLoading(true);
    try {
      let personId: string | null = null;
      if (name.trim()) {
        const resP = await fetch('/api/people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: name.trim() }),
        });
        const jsonP = await parseJsonSafe(resP);
        if (!jsonP.ok) {
          toast.error(jsonP.error || 'Falha ao cadastrar pessoa.');
          return;
        }
        personId = jsonP.data.id;
      }
      const resV = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate }),
      });
      const jsonV = await parseJsonSafe(resV);
      if (!jsonV.ok) {
        toast.error(jsonV.error || 'Falha ao cadastrar veículo.');
        return;
      }
      if (personId) {
        const resLink = await fetch('/api/vehicle-people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleId: jsonV.data.id, personId }),
        });
        const jsonLink = await parseJsonSafe(resLink);
        if (!jsonLink.ok) {
          toast.error(jsonLink.error || 'Falha ao vincular pessoa.');
          return;
        }
      }
      const resC = await fetch('/api/visits/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: jsonV.data.id, personId, purpose: 'despacho' }),
      });
      const jsonC = await parseJsonSafe(resC);
      if (!jsonC.ok) {
        toast.error(jsonC.error || 'Falha na entrada.');
        return;
      }
      setName('');
      await onSuccess();
    } catch (e: any) {
      toast.error(e?.message ?? e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="w-80 space-y-3 rounded bg-white p-4">
        <h2 className="text-lg font-medium">Cadastrar Placa</h2>
        <div>
          <label className="block text-sm">Placa</label>
          <input className="w-full rounded border px-3 py-2" value={plate} disabled />
        </div>
        <div>
          <label className="block text-sm">Nome (opcional)</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded border px-3 py-2" disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={onRegister}
            className="rounded bg-green-600 px-4 py-2 text-white"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Entrada'}
          </button>
        </div>
      </div>
    </div>
  );
}

