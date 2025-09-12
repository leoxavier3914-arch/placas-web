'use client';

import { useState } from 'react';
import { normalizePlate } from '@/lib/utils';
import { parseJsonSafe } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Vehicle {
  id: string;
  plate: string;
  model: string | null;
  color: string | null;
}

interface Props {
  vehicle: Vehicle;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export default function EditVehicleModal({ vehicle, onClose, onSuccess }: Props) {
  const [plate, setPlate] = useState(vehicle.plate);
  const [model, setModel] = useState(vehicle.model || '');
  const [color, setColor] = useState(vehicle.color || '');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const p = normalizePlate(plate);
    if (!p) {
      toast.error('Placa inválida');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate: p, model: model.trim() || null, color: color.trim() || null }),
      });
      const json = await parseJsonSafe(res).catch(() => null);
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || 'Falha ao editar.');
        return;
      }
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
        <h2 className="text-lg font-medium">Editar Veículo</h2>
        <div>
          <label className="block text-sm">Placa</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm">Modelo (opcional)</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm">Cor (opcional)</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded border px-3 py-2" disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={submit}
            className="rounded bg-green-600 px-4 py-2 text-white"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

