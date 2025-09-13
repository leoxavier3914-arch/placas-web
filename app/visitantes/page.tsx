'use client';

import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { parseJsonSafe, apiFetch } from '@/lib/api';
import PersonForm from '@/components/PersonForm';
import VehicleForm from '@/components/VehicleForm';
import { Person, Vehicle } from '@/types';

export default function VisitantesPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [showPerson, setShowPerson] = useState(false);
  const [showVehicle, setShowVehicle] = useState(false);

  const loadPeople = async () => {
    try {
      const res = await apiFetch('/api/people', { cache: 'no-store' });
      const json = await parseJsonSafe<{ data?: Person[] }>(res).catch(() => null);
      if (res.ok && json?.data) setPeople(json.data);
    } catch (e) {
      logError('loadPeople', e);
      toast.error('Falha ao carregar pessoas.');
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await apiFetch('/api/vehicles', { cache: 'no-store' });
      const json = await parseJsonSafe<{ data?: Vehicle[] }>(res).catch(() => null);
      if (res.ok && json?.data) setVehicles(json.data);
    } catch (e) {
      logError('loadVehicles', e);
      toast.error('Falha ao carregar veículos.');
    }
  };

  useEffect(() => {
    loadPeople();
    loadVehicles();
  }, []);

  const reloadData = async () => {
    await loadPeople();
    await loadVehicles();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Visitantes</h1>
        <button
          onClick={() => setShowOptions(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Novo
        </button>
      </div>
      {people.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma pessoa cadastrada.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {people.map((p) => (
            <div key={p.id} className="rounded-lg bg-white p-4 shadow">
              <p className="font-medium">{p.full_name}</p>
              {p.doc_number && (
                <p className="text-sm text-gray-600">{p.doc_number}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showOptions && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="w-80 space-y-3 rounded bg-white p-4">
            <h2 className="text-lg font-medium">Novo</h2>
            <button
              onClick={() => {
                setShowOptions(false);
                setShowPerson(true);
              }}
              className="w-full rounded bg-blue-600 px-4 py-2 text-white"
            >
              Novo Visitante
            </button>
            <button
              onClick={() => {
                setShowOptions(false);
                setShowVehicle(true);
              }}
              className="w-full rounded bg-green-600 px-4 py-2 text-white"
            >
              Novo Veículo
            </button>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowOptions(false)}
                className="rounded border px-3 py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPerson && (
        <div className="fixed inset-0 overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto w-full max-w-md">
            <PersonForm
              vehicles={vehicles}
              onSaved={async () => {
                await reloadData();
                setShowPerson(false);
              }}
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => setShowPerson(false)}
                className="rounded border bg-white px-4 py-2"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showVehicle && (
        <div className="fixed inset-0 overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto w-full max-w-md">
            <VehicleForm
              onSaved={async () => {
                await reloadData();
                setShowVehicle(false);
              }}
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => setShowVehicle(false)}
                className="rounded border bg-white px-4 py-2"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

