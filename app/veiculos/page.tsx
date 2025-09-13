'use client';

import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { parseJsonSafe, apiFetch } from '@/lib/api';
import VehicleCard from '@/components/VehicleCard';
import { Person, Vehicle, VehiclePerson } from '@/types';

export default function VeiculosPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclePeople, setVehiclePeople] = useState<Record<string, VehiclePerson[]>>({});

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

  const loadVehiclePeople = async () => {
    try {
      const res = await apiFetch('/api/vehicle-people', { cache: 'no-store' });
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

  const reloadVehiclesAndLinks = async () => {
    await loadVehicles();
    await loadVehiclePeople();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Veículos</h1>
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
  );
}

