'use client';

import { useState } from 'react';
import { normalizePlate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { parseJsonSafe, apiFetch } from '@/lib/api';
import { Person, Vehicle } from '@/types';

interface Props {
  vehicles: Vehicle[];
  onSaved: () => Promise<void> | void;
}

export default function PersonForm({ vehicles, onSaved }: Props) {
  const [fullName, setFullName] = useState('');
  const [doc, setDoc] = useState('');
  const [notes, setNotes] = useState('');
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!fullName.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }
    const nPlate = normalizePlate(plate);
    if (plate.trim() && !nPlate) {
      toast.error('Informe a placa no formato válido (ex.: ABC1D23)');
      return;
    }
    setLoading(true);
    try {
      if (nPlate) {
        let vehicle = vehicles.find((v) => v.plate === nPlate);
        if (!vehicle) {
          const resVehicle = await apiFetch('/api/vehicles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plate: nPlate }),
          });
          const jsonVehicle = await parseJsonSafe<{
            ok: boolean;
            data: Vehicle;
            error?: string;
          }>(resVehicle);
          if (!jsonVehicle.ok) {
            toast.error(jsonVehicle.error || 'Falha ao cadastrar veículo.');
            return;
          }
          await onSaved();
        }
      }

      const res = await apiFetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          doc_number: doc.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const json = await parseJsonSafe<{
        ok: boolean;
        data: Person;
        error?: string;
      }>(res);
      if (!json.ok) {
        toast.error(json.error || 'Falha ao cadastrar pessoa.');
        return;
      }
      toast.success('Pessoa cadastrada com sucesso!');
      setFullName('');
      setDoc('');
      setNotes('');
      setPlate('');
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
      <h2 className="mb-3 text-lg font-medium">Pessoa</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-sm">Nome completo *</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ex.: João da Silva"
          />
        </div>
        <div>
          <label className="block text-sm">Documento (opcional)</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
            placeholder="Ex.: 12345678900"
          />
        </div>
        <div>
          <label className="block text-sm">Placa (opcional)</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            list="plates-list"
            placeholder="Ex.: ABC1D23"
          />
          <datalist id="plates-list">
            {vehicles.map((v) => (
              <option key={v.id} value={v.plate} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm">Observações (opcional)</label>
          <textarea
            className="w-full rounded border px-3 py-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anotações sobre a pessoa"
            rows={3}
          />
        </div>
        <button
          onClick={submit}
          className="rounded bg-green-600 px-4 py-2 text-white"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar Pessoa'}
        </button>
      </div>
    </div>
  );
}

