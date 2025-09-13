'use client';

import { useState } from 'react';
import { parseJsonSafe, apiFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Vehicle {
  id: string;
  plate: string;
  model: string | null;
  color: string | null;
}

interface Person {
  id: string;
  full_name: string | null;
}

interface Props {
  vehicle: Vehicle;
  initialPeople: Person[];
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export default function ConfirmModal({ vehicle, initialPeople, onClose, onSuccess }: Props) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    initialPeople[0]?.id || null
  );
  const [purpose, setPurpose] = useState('despacho');
  const [entering, setEntering] = useState(false);

  const onEntryConfirm = async () => {
    if (!selectedPersonId) {
      toast.error('Selecione um visitante vinculado.');
      return;
    }
    setEntering(true);
    try {
      const resCheck = await apiFetch('/api/visits/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          personId: selectedPersonId,
          purpose,
        }),
      });
      const jsonCheck = await parseJsonSafe(resCheck);
      if (!jsonCheck.ok) {
        toast.error(jsonCheck.error || 'Falha na entrada.');
        return;
      }
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message ?? e);
    } finally {
      setEntering(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="w-80 space-y-3 rounded bg-white p-4">
        <h2 className="text-lg font-medium text-green-600">CADASTRADO</h2>
        <div>
          <label className="block text-sm">Placa</label>
          <input className="w-full rounded border px-3 py-2" value={vehicle.plate} disabled />
        </div>
        <div>
          <label className="block text-sm">Modelo</label>
          <input className="w-full rounded border px-3 py-2" value={vehicle.model ?? ''} disabled />
        </div>
        <div>
          <label className="block text-sm">Cor</label>
          <input className="w-full rounded border px-3 py-2" value={vehicle.color ?? ''} disabled />
        </div>
        <div>
          <label className="block text-sm">Nome</label>
          {initialPeople.length > 0 ? (
            <select
              className="w-full rounded border px-3 py-2"
              value={selectedPersonId ?? ''}
              onChange={(e) => setSelectedPersonId(e.target.value || null)}
            >
              <option value="">Selecione</option>
              {initialPeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-500">Nenhum visitante vinculado.</p>
          )}
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
          <button
            onClick={onClose}
            className="rounded border px-3 py-2"
            disabled={entering}
          >
            Cancelar
          </button>
          <button
            onClick={onEntryConfirm}
            className="rounded bg-green-600 px-4 py-2 text-white"
            disabled={entering}
          >
            {entering ? 'Entrando...' : 'Entrada'}
          </button>
        </div>
      </div>
    </div>
  );
}

