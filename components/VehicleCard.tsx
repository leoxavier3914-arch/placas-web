'use client';

import { useState } from 'react';
import { parseJsonSafe } from '@/lib/api';
import { normalizePlate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { Person, Vehicle, VehiclePerson } from '@/types';

interface VehicleCardProps {
  vehicle: Vehicle;
  people: Person[];
  vehiclePeople: VehiclePerson[];
  onUpdated: () => Promise<void> | void;
}

export default function VehicleCard({ vehicle, people, vehiclePeople, onUpdated }: VehicleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selection, setSelection] = useState('');

  const linkPerson = async () => {
    if (!selection) {
      toast.error('Selecione uma pessoa');
      return;
    }
    try {
      const res = await fetch('/api/vehicle-people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: vehicle.id, personId: selection }),
      });
      const json = await parseJsonSafe<{ ok?: boolean; error?: string }>(res).catch(() => null);
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || 'Falha ao vincular.');
        return;
      }
      setSelection('');
      await onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const unlinkPerson = async (personId: string) => {
    if (!confirm('Desvincular este condutor?')) return;
    try {
      const res = await fetch('/api/vehicle-people', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: vehicle.id, personId }),
      });
      const json = await parseJsonSafe<{ ok?: boolean; error?: string }>(res).catch(() => null);
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || 'Falha ao desvincular.');
        return;
      }
      await onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const editVehicle = async () => {
    const plateInput = prompt('Placa', vehicle.plate);
    if (!plateInput) return;
    const plate = normalizePlate(plateInput);
    if (!plate) {
      toast.error('Placa inválida');
      return;
    }
    const model = prompt('Modelo', vehicle.model || '') || null;
    const color = prompt('Cor', vehicle.color || '') || null;
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate, model, color }),
      });
      const json = await parseJsonSafe<{ ok?: boolean; error?: string }>(res).catch(() => null);
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || 'Falha ao editar.');
        return;
      }
      await onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const deleteVehicle = async () => {
    if (!confirm('Deseja excluir este veículo?')) return;
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, { method: 'DELETE' });
      const json = await parseJsonSafe<{ ok?: boolean; error?: string }>(res).catch(() => null);
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || 'Falha ao excluir.');
        return;
      }
      await onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="rounded border p-4">
      <div className="cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <span className="font-medium">{vehicle.plate}</span>
        {vehicle.model && <span className="text-gray-600"> — {vehicle.model}</span>}
        {vehicle.color && <span className="text-gray-600"> ({vehicle.color})</span>}
      </div>
      {expanded && (
        <div className="mt-3 space-y-2">
          <div>
            {vehiclePeople.length ? (
              <ul className="space-y-1">
                {vehiclePeople.map((vp) => (
                  <li key={vp.personId} className="flex justify-between text-sm">
                    <span>{vp.person.full_name}</span>
                    <button className="text-red-600" onClick={() => unlinkPerson(vp.personId)}>
                      Desvincular
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhum condutor vinculado.</p>
            )}
          </div>
          <div className="flex gap-2">
            <select
              className="flex-1 rounded border px-2 py-1"
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
            >
              <option value="">Selecionar pessoa</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
            <button
              onClick={linkPerson}
              className="rounded bg-green-600 px-2 py-1 text-white text-sm"
            >
              Vincular
            </button>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={editVehicle}
              className="rounded bg-blue-600 px-3 py-1 text-white text-sm"
            >
              Editar
            </button>
            <button
              onClick={deleteVehicle}
              className="rounded bg-red-600 px-3 py-1 text-white text-sm"
            >
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

