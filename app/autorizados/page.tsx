'use client';
import { useEffect, useState } from 'react';
import { normalizePlate } from '@/lib/utils';

export default function AutorizadosPage() {
  const [plate, setPlate] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchAuthorized = async () => {
    const res = await fetch('/api/authorized', { cache: 'no-store' });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.data) setAuthorized(json.data);
    else alert(json?.error || 'Falha ao carregar lista.');
  };

  useEffect(() => {
    fetchAuthorized();
  }, []);

  const submit = async () => {
    const p = normalizePlate(plate);
    if (!p || !name.trim() || !department.trim()) {
      alert('Preencha placa, nome e departamento.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(editId ? `/api/authorized/${editId}` : '/api/authorized', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: p,
          name: name.trim(),
          department: department.trim(),
          model: model.trim() || null,
          color: color.trim() || null,
        }),
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        alert(json?.error || 'Falha ao salvar.');
        return;
      }

      alert(editId ? 'Registro atualizado com sucesso!' : 'Registro salvo com sucesso!');
      setPlate('');
      setName('');
      setDepartment('');
      setModel('');
      setColor('');
      setEditId(null);
      fetchAuthorized();
    } catch (e: any) {
      alert(e?.message ?? e);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (a: any) => {
    setEditId(a.id);
    setPlate(a.plate);
    setName(a.name);
    setDepartment(a.department);
    setModel(a.model || '');
    setColor(a.color || '');
  };

  const remove = async (id: string) => {
    if (!confirm('Deseja excluir este registro?')) return;
    try {
      const res = await fetch(`/api/authorized/${id}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        alert(json?.error || 'Falha ao excluir.');
        return;
      }
      fetchAuthorized();
    } catch (e: any) {
      alert(e?.message ?? e);
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
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm">Modelo (opcional)</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Ex.: Caminhão"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm">Cor (opcional)</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Ex.: Branco"
            />
          </div>
        </div>
        <button
          onClick={submit}
          className="rounded bg-green-600 px-4 py-2 text-white"
          disabled={loading}
        >
          {loading
            ? editId
              ? 'Atualizando...'
              : 'Salvando...'
            : editId
            ? 'Atualizar'
            : 'Salvar'}
        </button>
      </div>

      <div className="rounded border bg-white p-4">
        {authorized.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum autorizado cadastrado.</p>
        ) : (
          <ul className="divide-y">
            {authorized.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">
                    {a.plate}
                    {a.model && (
                      <span className="text-gray-600"> — {a.model}</span>
                    )}
                    {a.color && (
                      <span className="text-gray-600"> ({a.color})</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {a.name} - {a.department}
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => startEdit(a)}
                    className="rounded bg-blue-600 px-3 py-1 text-white text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    className="rounded bg-red-600 px-3 py-1 text-white text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
