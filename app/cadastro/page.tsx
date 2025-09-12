'use client';

import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { parseJsonSafe } from '@/lib/api';
import PersonForm from '@/components/PersonForm';
import VehicleForm from '@/components/VehicleForm';
import VehicleCard from '@/components/VehicleCard';
import { Person, Vehicle, VehiclePerson } from '@/types';

export default function CadastroPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclePeople, setVehiclePeople] = useState<Record<string, VehiclePerson[]>>({});

  const loadPeople = async () => {
    try {
      const res = await fetch('/api/people', { cache: 'no-store' });
      const json = await parseJsonSafe<{ data?: Person[] }>(res).catch(() => null);
      if (res.ok && json?.data) setPeople(json.data);
    } catch (e) {
      logError('loadPeople', e);
      toast.error('Falha ao carregar pessoas.');
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles', { cache: 'no-store' });
      const json = await parseJsonSafe<{ data?: Vehicle[] }>(res).catch(() => null);
      if (res.ok && json?.data) setVehicles(json.data);
    } catch (e) {
      logError('loadVehicles', e);
      toast.error('Falha ao carregar veículos.');
    }
  };

  const loadVehiclePeople = async () => {
    try {
      const res = await fetch('/api/vehicle-people', { cache: 'no-store' });
      const json = await parseJsonSafe<{ data?: VehiclePerson[] }>(res).catch(() => null);
      if (res.ok && json?.data) {
        const map: Record<string, VehiclePerson[]> = {};
        json.data.forEach((vp) => {
          if (!map[vp.vehicleId]) map[vp.vehicleId] = [];
          map[vp.vehicleId].push(vp);
        });
        setVehiclePeople(map);
      }
    } catch (e) {
      logError('loadVehiclePeople', e);
      toast.error('Falha ao carregar vínculos de veículos.');
    }
  };

  useEffect(() => {
    loadPeople();
    loadVehicles();
    loadVehiclePeople();
  }, []);

  const reloadAll = async () => {
    await loadPeople();
    await loadVehicles();
    await loadVehiclePeople();
  };

  const reloadVehiclesAndLinks = async () => {
    await loadVehicles();
    await loadVehiclePeople();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Cadastros</h1>

      <PersonForm vehicles={vehicles} onSaved={reloadAll} />

      <VehicleForm onSaved={reloadVehiclesAndLinks} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-medium">Pessoas cadastradas</h2>
          {people.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma pessoa cadastrada.</p>
          ) : (
            <ul className="divide-y">
              {people.map((p) => (
                <li key={p.id} className="py-2 text-sm">
                  <span className="font-medium">{p.full_name}</span>
                  {p.doc_number && (
                    <span className="text-gray-600"> — {p.doc_number}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-medium">Veículos cadastrados</h2>
          {vehicles.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum veículo cadastrado.</p>
          ) : (
            <div className="space-y-4">
              {vehicles.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  people={people}
                  vehiclePeople={vehiclePeople[v.id] || []}
                  onUpdated={reloadVehiclesAndLinks}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

