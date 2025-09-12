'use client';
import { useState, useEffect } from 'react';
import { normalizePlate } from '@/lib/utils';

type ApiResp<T> = { ok: true; data: T } | { ok: false; error: string };

async function parseJsonSafe(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    // tenta ler texto para debugar
    const text = await res.text().catch(() => '');
    throw new Error(text || `Servidor retornou ${res.status} sem JSON.`);
  }
  return res.json();
}

export default function CadastroPage() {
  // Pessoa
  const [pFullName, setPFullName] = useState('');
  const [pDoc, setPDoc] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pNotes, setPNotes] = useState('');
  const [pLoading, setPLoading] = useState(false);

  // Veículo
  const [vPlate, setVPlate] = useState('');
  the definition of the function for the following code is as follows
  const [vModel, setVModel] = useState('');
  const [vColor, setVColor] = useState('');
  const [vLoading, setVLoading] = useState(false);

  // listas
  const [people, setPeople] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehiclePeople, setVehiclePeople] = useState<Record<string, any[]>>({});
  const [expandedVehicles, setExpandedVehicles] = useState<string[]>([]);
  const [linkSelection, setLinkSelection] = useState<Record<string, string>>({});

  const loadPeople = async () => {
    try {
      const res = await fetch('/api/people', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data) setPeople(json.data);
    } catch {}
  };

  const loadVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data) setVehicles(json.data);
    } catch {}
  };

  const loadVehiclePeople = async () => {
    try {
      const res = await fetch('/api/vehicle-people', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data) {
        const map: Record<string, any[]> = {};
        json.data.forEach((vp: any) => {
          if (!map[vp.vehicleId]) map[vp.vehicleId] = [];
          map[vp.vehicleId].push(vp);
        });
        setVehiclePeople(map);
      }
    } catch {}
  };

  useEffect(() => {
    loadPeople();
    loadVehicles();
    loadVehiclePeople();
  }, []);

  const submitPessoa = async () => {
    if (!pFullName.trim()) {
      alert('Nome completo é obrigatório');
      return;
    }
    setPLoading(true);
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: pFullName.trim(),
          doc_number: pDoc.trim() || null,
          phone: pPhone.trim() || null,
          email: pEmail.trim() || null,
          notes: pNotes.trim() || null,
        }),
      });

      const json = (await parseJsonSafe(res)) as ApiResp<any>;
      if (!json.ok) {
        alert((json as { ok: false; error: string }).error);
        return;
      }

      alert('Pessoa cadastrada com sucesso!');
      setPFullName('');
      setPDoc('');
      setPPhone('');
      setPEmail('');
      setPNotes('');
      await loadPeople();
    } catch (e: any) {
      alert(`Falha: ${e?.message ?? e}`);
    } finally {
      setPLoading(false);
    }
  };

  const submitVeiculo = async () => {
    const plate = normalizePlate(vPlate);
    if (!plate) {
      alert('Informe a placa (ex.: ABC1D23)');
      return;
    }
    setVLoading(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate,
          model: vModel.trim() || null,
          color: vColor.trim() || null,
        }),
      });

      const json = (await parseJsonSafe(res)) as ApiResp<any>;
      if (!json.ok) {
        alert((json as { ok: false; error: string }).error);
        return;
      }
      alert('Veículo cadastrado com sucesso!');
      setVPlate('');
      setVModel('');
      setVColor('');
      await loadVehicles();
    } catch (e: any) {
      alert(`Falha: ${e?.message ?? e}`);
    } finally {
      setVLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedVehicles((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const linkPerson = async (vehicleId: string) => {
    const personId = linkSelection[vehicleId];
    if (!personId) {
      alert('Selecione uma pessoa');
      return;
    }
    try {
      const res = await fetch('/api/vehicle-people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, personId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        alert(json?.error || 'Falha ao vincular.');
        return;
      }
      setLinkSelection((s) => ({ ...s, [vehicleId]: '' }));
      await loadVehiclePeople();
    } catch (e: any) {
      alert(e?.message ?? e);
    }
  };

  const unlinkPerson = async (vehicleId: string, personId: string) => {
    if (!confirm('Desvincular este condutor?')) return;
    try {
      const res = await fetch('/api/vehicle-people', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, personId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        alert(json?.error || 'Falha ao desvincular.');
        return;
      }
      await loadVehiclePeople();
    } catch (e: any) {
      alert(e?.message ?? e);
    }
  };

  const editVehicle = async (v: any) => {
    const plateInput = prompt('Placa', v.plate);
    if (!plateInput) return;
    const plate = normalizePlate(plateInput);
    if (!plate) {
      alert('Placa inválida');
      return;
    }
    const model = prompt('Modelo', v.model || '') || null;
    const color = prompt('Cor', v.color || '') || null;
    try {
      const res = await fetch(`/api/vehicles/${v.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate, model, color }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        alert(json?.error || 'Falha ao editar.');
        return;
      }
      await loadVehicles();
      await loadVehiclePeople();
    } catch (e: any) {
      alert(e?.message ?? e);
    }
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm('Deseja excluir este veículo?')) return;
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        alert(json?.error || 'Falha ao excluir.');
        return;
      }
      await loadVehicles();
      await loadVehiclePeople();
    } catch (e: any) {
      alert(e?.message ?? e);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Cadastros</h1>

      {/* Cadastro de Pessoa */}
      <div className="rounded border bg-white p-4">
        <h2 className="mb-3 text-lg font-medium">Pessoa</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Nome completo *</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={pFullName}
              onChange={(e) => setPFullName(e.target.value)}
              placeholder="Ex.: João da Silva"
            />
          </div>
          <div>
            <label className="block text-sm">Documento (opcional)</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={pDoc}
              onChange={(e) => setPDoc(e.target.value)}
              placeholder="Ex.: 12345678900"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm">Telefone (opcional)</label>
              <input
                className="w-full rounded border px-3 py-2"
                value={pPhone}
                onChange={(e) => setPPhone(e.target.value)}
                placeholder="Ex.: (11) 90000-0000"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm">E-mail (opcional)</label>
              <input
                className="w-full rounded border px-3 py-2"
                value={pEmail}
                onChange={(e) => setPEmail(e.target.value)}
                placeholder="Ex.: joao@email.com"
                type="email"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm">Observações (opcional)</label>
            <textarea
              className="w-full rounded border px-3 py-2"
              value={pNotes}
              onChange={(e) => setPNotes(e.target.value)}
              placeholder="Anotações sobre a pessoa"
              rows={3}
            />
          </div>
          <button
            onClick={submitPessoa}
            className="rounded bg-green-600 px-4 py-2 text-white"
            disabled={pLoading}
          >
            {pLoading ? 'Salvando...' : 'Salvar Pessoa'}
          </button>
        </div>
      </div>

      {/* Cadastro de Veículo */}
      <div className="rounded border bg-white p-4">
        <h2 className="mb-3 text-lg font-medium">Veículo</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Placa *</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={vPlate}
              onChange={(e) => setVPlate(e.target.value)}
              placeholder="Ex.: ABC1D23"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm">Modelo (opcional)</label>
              <input
                className="w-full rounded border px-3 py-2"
                value={vModel}
                onChange={(e) => setVModel(e.target.value)}
                placeholder="Ex.: Caminhão"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm">Cor (opcional)</label>
              <input
                className="w-full rounded border px-3 py-2"
                value={vColor}
                onChange={(e) => setVColor(e.target.value)}
                placeholder="Ex.: Branco"
              />
            </div>
          </div>
          <button
            onClick={submitVeiculo}
            className="rounded bg-blue-600 px-4 py-2 text-white"
            disabled={vLoading}
          >
            {vLoading ? 'Salvando...' : 'Salvar Veículo'}
          </button>
        </div>
      </div>

      {/* Listas de Cadastros */}
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
                <div key={v.id} className="rounded border p-4">
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleExpand(v.id)}
                  >
                    <span className="font-medium">{v.plate}</span>
                    {v.model && (
                      <span className="text-gray-600"> — {v.model}</span>
                    )}
                    {v.color && (
                      <span className="text-gray-600"> ({v.color})</span>
                    )}
                  </div>
                  {expandedVehicles.includes(v.id) && (
                    <div className="mt-3 space-y-2">
                      <div>
                        {vehiclePeople[v.id]?.length ? (
                          <ul className="space-y-1">
                            {vehiclePeople[v.id].map((vp: any) => (
                              <li
                                key={vp.personId}
                                className="flex justify-between text-sm"
                              >
                                <span>{vp.person.full_name}</span>
                                <button
                                  className="text-red-600"
                                  onClick={() =>
                                    unlinkPerson(v.id, vp.personId)
                                  }
                                >
                                  Desvincular
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Nenhum condutor vinculado.
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 rounded border px-2 py-1"
                          value={linkSelection[v.id] || ''}
                          onChange={(e) =>
                            setLinkSelection((s) => ({
                              ...s,
                              [v.id]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Selecionar pessoa</option>
                          {people.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.full_name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => linkPerson(v.id)}
                          className="rounded bg-green-600 px-2 py-1 text-white text-sm"
                        >
                          Vincular
                        </button>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => editVehicle(v)}
                          className="rounded bg-blue-600 px-3 py-1 text-white text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteVehicle(v.id)}
                          className="rounded bg-red-600 px-3 py-1 text-white text-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
