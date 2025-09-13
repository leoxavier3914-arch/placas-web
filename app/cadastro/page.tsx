'use client';

import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { parseJsonSafe, apiFetch } from '@/lib/api';
import PersonForm from '@/components/PersonForm';
import VehicleForm from '@/components/VehicleForm';
import { Vehicle } from '@/types';

export default function CadastroPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

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
    loadVehicles();
  }, []);

  const reloadVehicles = async () => {
    await loadVehicles();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Cadastros</h1>

      <PersonForm vehicles={vehicles} onSaved={reloadVehicles} />

      <VehicleForm onSaved={reloadVehicles} />
    </div>
  );
}

