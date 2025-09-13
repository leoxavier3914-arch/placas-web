'use client';

import { useState } from 'react';
import { parseJsonSafe, apiFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';
 
import ConfirmDeleteModal from './ConfirmDeleteModal';
import EditVehicleModal from './EditVehicleModal';

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
  const [editOpen, setEditOpen] = useState(false);
  const [confirmUnlinkPerson, setConfirmUnlinkPerson] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const linkPerson = async () => {
    if (!selection) {
      toast.error('Selecione uma pessoa');
      return;
    }
    try {
      const res = await apiFetch('/api/vehicle-people', {
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
    try {
      const res = await apiFetch('/api/vehicle-people', {
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

  const editVehicle = () => setEditOpen(true);
  const deleteVehicle = async () => {
    try {
      const res = await apiFetch(`/api/vehicles/${vehicle.id}`, { method: 'DELETE' });
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
    <div className="rounded-lg bg-white p-4 shadow">
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setExpanded((v) => !v)}
      >
        <div>
          <span className="font-semibold">{vehicle.plate}</span>
          {vehicle.model && <span className="text-gray-600"> — {vehicle.model}</span>}
          {vehicle.color && <span className="text-gray-600"> ({vehicle.color})</span>}
        </div>
        <span className="text-lg">{expanded ? "−" : "+"}</span>
      </div>
      {expanded && (
        <div className="mt-3 space-y-2">
          <div>
            {vehiclePeople.length ? (
              <ul className="space-y-1">
                {vehiclePeople.map((vp) => (
                  <li key={vp.personId} className="flex justify-between text-sm">
                    <span>{vp.person.full_name}</span>
                    <button
                      className="text-red-600"
                      onClick={() => setConfirmUnlinkPerson(vp.personId)}
                    >
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
              onClick={() => setConfirmDelete(true)}
              className="rounded bg-red-600 px-3 py-1 text-white text-sm"
            >
              Excluir
            </button>
          </div>
        </div>
      )}
      {confirmUnlinkPerson && (
        <ConfirmDeleteModal
          message="Desvincular este condutor?"
          confirmText="Desvincular"
          onCancel={() => setConfirmUnlinkPerson(null)}
          onConfirm={async () => {
            await unlinkPerson(confirmUnlinkPerson);
            setConfirmUnlinkPerson(null);
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmDeleteModal
          message="Deseja excluir este veículo?"
          confirmText="Excluir"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteVehicle();
            setConfirmDelete(false);
          }}
        />
      )}
      {editOpen && (
        <EditVehicleModal
          vehicle={vehicle}
          onClose={() => setEditOpen(false)}
          onSuccess={async () => {
            setEditOpen(false);
            await onUpdated();
          }}
        />
      )}
    </div>
  );
}

