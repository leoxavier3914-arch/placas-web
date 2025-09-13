'use client';

import { useState } from 'react';
import { parseJsonSafe, apiFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Props {
  plate: string;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export default function RegisterModal({ plate, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [doc, setDoc] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [purpose, setPurpose] = useState('despacho');
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!doc.trim()) {
      toast.error('Documento é obrigatório');
      return;
    }
    setLoading(true);
    try {
      const resP = await apiFetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name.trim(), doc_number: doc.trim() }),
      });
      const jsonP = await parseJsonSafe(resP);
      if (!jsonP.ok) {
        toast.error(jsonP.error || 'Falha ao cadastrar pessoa.');
        return;
      }
      const personId = jsonP.data.id;

      const resV = await apiFetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate, model: model.trim() || null, color: color.trim() || null }),
      });
      const jsonV = await parseJsonSafe(resV);
      if (!jsonV.ok) {
        toast.error(jsonV.error || 'Falha ao cadastrar veículo.');
        return;
      }

      const resLink = await apiFetch('/api/vehicle-people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: jsonV.data.id, personId }),
      });
      const jsonLink = await parseJsonSafe(resLink);
      if (!jsonLink.ok) {
        toast.error(jsonLink.error || 'Falha ao vincular pessoa.');
        return;
      }

      const resC = await apiFetch('/api/visits/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: jsonV.data.id, personId, purpose }),
      });
      const jsonC = await parseJsonSafe(resC);
      if (!jsonC.ok) {
        toast.error(jsonC.error || 'Falha na entrada.');
        return;
      }
      setName('');
      setDoc('');
      setModel('');
      setColor('');
      setPurpose('despacho');
      onSuccess();
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
          <label className="block text-sm">Nome *</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm">Documento *</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
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
        <div>
          <label className="block text-sm">Finalidade</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          >
            <option value="despacho">Despacho</option>
            <option value="retirada">Retiro</option>
          </select>
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

