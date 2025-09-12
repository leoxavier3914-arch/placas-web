'use client';

import { useState } from 'react';
import { parseJsonSafe } from '@/lib/api';
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
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    initialPeople[0]?.id || null
  );
  const [newPersonName, setNewPersonName] = useState('');
  const [linking, setLinking] = useState(false);
  const [purpose, setPurpose] = useState('despacho');
  const [entering, setEntering] = useState(false);

  const onLinkPerson = async () => {
    if (!newPersonName.trim()) return;
    setLinking(true);
    try {
      const resP = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: newPersonName.trim() }),
      });
      const jsonP = await parseJsonSafe(resP);
      if (!jsonP.ok) {
        toast.error(jsonP.error || 'Falha ao cadastrar pessoa.');
        return;
      }
      const personId = jsonP.data.id;
      const resL = await fetch('/api/vehicle-people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: vehicle.id, personId }),
      });
      const jsonL = await parseJsonSafe(resL);
      if (!jsonL.ok) {
        toast.error(jsonL.error || 'Falha ao vincular pessoa.');
        return;
      }
      setPeople((prev) => [...prev, { id: personId, full_name: jsonP.data.full_name }]);
      setSelectedPersonId(personId);
      setNewPersonName('');
    } catch (e: any) {
      toast.error(e?.message ?? e);
    } finally {
      setLinking(false);
    }
  };

  const onUnlinkPerson = async (personId: string) => {
    try {
      const res = await fetch('/api/vehicle-people', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: vehicle.id, personId }),
      });
      const json = await parseJsonSafe(res);
      if (!json.ok) {
        toast.error(json.error || 'Falha ao desvincular.');
        return;
      }
      setPeople((prev) => prev.filter((p) => p.id !== personId));
      if (selectedPersonId === personId) setSelectedPersonId(null);
    } catch (e: any) {
      toast.error(e?.message ?? e);
    }
  };

  const onEntryConfirm = async () => {
    if (!selectedPersonId) {
      toast.error('Selecione ou cadastre uma pessoa vinculada.');
      return;
    }
    setEntering(true);
    try {
      const resCheck = await fetch('/api/visits/checkin', {
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
      await onSuccess();
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
          {people.length > 0 ? (
            <select
              className="w-full rounded border px-3 py-2"
              value={selectedPersonId ?? ''}
              onChange={(e) => setSelectedPersonId(e.target.value || null)}
            >
              <option value="">Selecione</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma pessoa vinculada.</p>
          )}
          {people.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {people.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.full_name}</span>
                  <button onClick={() => onUnlinkPerson(p.id)} className="text-red-600">
                    Desvincular
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm">Adicionar nova pessoa</label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded border px-3 py-2"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
            />
            <button
              onClick={onLinkPerson}
              className="rounded bg-blue-600 px-3 py-2 text-white"
              disabled={linking}
            >
              {linking ? 'Vinculando...' : 'Vincular'}
            </button>
          </div>
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

