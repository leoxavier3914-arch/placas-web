'use client';
import { useState } from 'react';
import { normalizePlate } from '@/lib/utils';

export default function AutorizadosPage() {
  const [plate, setPlate] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const p = normalizePlate(plate);
    if (!p || !name.trim() || !department.trim()) {
      alert('Preencha placa, nome e departamento.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/authorized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate: p, name: name.trim(), department: department.trim() }),
      });
      const json = await res.json();
      if (!json.ok) {
        alert(json.error || 'Falha ao salvar.');
        return;
      }
      alert('Registro salvo com sucesso!');
      setPlate('');
      setName('');
      setDepartment('');
    } catch (e: any) {
      alert(e?.message ?? e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Autorizados</h1>
      <div className="rounded border bg-white p-4 space-y-3">
        <div>
          <label className="block text-sm">Placa *</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="Ex.: ABC1D23"
          />
        </div>
        <div>
          <label className="block text-sm">Nome *</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da pessoa"
          />
        </div>
        <div>
          <label className="block text-sm">Departamento *</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Departamento"
          />
        </div>
        <button
          onClick={submit}
          className="rounded bg-green-600 px-4 py-2 text-white"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
