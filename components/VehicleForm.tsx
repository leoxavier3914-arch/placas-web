'use client';

import { useState } from 'react';
import { normalizePlate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { parseJsonSafe, apiFetch } from '@/lib/api';
import { Vehicle } from '@/types';

interface Props {
  onSaved: () => Promise<void> | void;
}

export default function VehicleForm({ onSaved }: Props) {
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const nPlate = normalizePlate(plate);
    if (!nPlate) {
      toast.error('Informe a placa (ex.: ABC1D23)');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: nPlate,
          model: model.trim() || null,
          color: color.trim() || null,
        }),
      });
      const json = await parseJsonSafe<{ ok: boolean; data?: Vehicle; error?: string }>(res);
      if (!json.ok) {
        toast.error(json.error || 'Falha ao cadastrar veículo.');
        return;
      }
      toast.success('Veículo cadastrado com sucesso!');
      setPlate('');
      setModel('');
      setColor('');
      await onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Falha: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded border bg-white p-4">
      <h2 className="mb-3 text-lg font-medium">Veículo</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-sm">Placa *</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="Ex.: ABC1D23"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm">Modelo (opcional)</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Ex.: Caminhão"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm">Cor (opcional)</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Ex.: Branco"
            />
          </div>
        </div>
        <button
          onClick={submit}
          className="rounded bg-blue-600 px-4 py-2 text-white"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar Veículo'}
        </button>
      </div>
    </div>
  );
}

