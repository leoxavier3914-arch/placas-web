'use client';
import { useEffect, useState } from 'react';
import { normalizePlate } from '@/lib/utils';

type OpenVisit = {
  id: string;
  checkin_time: string;
  people: { full_name: string | null } | null;
  vehicles: { plate: string | null } | null;
};

async function parseJsonSafe(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Servidor retornou ${res.status} sem JSON.`);
  }
  return res.json();
}

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

export default function Home() {
  const [input, setInput] = useState('');
  const [openVisits, setOpenVisits] = useState<OpenVisit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [busyVisitId, setBusyVisitId] = useState<string | null>(null);

  // Modal de cadastro
  const [showModal, setShowModal] = useState(false);
  const [pendingPlate, setPendingPlate] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registering, setRegistering] = useState(false);

  const loadOpenVisits = async () => {
    setLoadingVisits(true);
    try {

      const res = await fetch('/api/visits/open', { cache: 'no-store' });
      const json = await parseJsonSafe(res);
      if (json.ok) setOpenVisits(json.data || []);
    } finally {
      setLoadingVisits(false);
    }
  };

  useEffect(() => {
    loadOpenVisits();
  }, []);

  const onVerify = async () => {
    const plate = normalizePlate(input);
    if (!plate) return;
    try {
      const res = await fetch(`/api/lookup/plate/${plate}`);
      const json = await parseJsonSafe(res);
      if (!json.found) {
        setPendingPlate(plate);
        setShowModal(true);
        return;
      }
      const open = (json.visits || []).find((v: any) => !v.checkout_time);
      if (open) {
        alert('Placa já possui entrada em andamento.');
        return;
      }
      const resCheck = await fetch('/api/visits/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: json.vehicle.id, personId: null, purpose: 'despacho' }),
      });
      const jsonCheck = await parseJsonSafe(resCheck);
      if (!jsonCheck.ok) {
        alert(jsonCheck.error || 'Falha na entrada.');
        return;
      }
      await loadOpenVisits();
      setInput('');
    } catch (e: any) {
      alert(e?.message ?? e);
    }
  };

  const onRegisterAndEntry = async () => {
    setRegistering(true);
    try {
      let personId: string | null = null;
      if (registerName.trim()) {
        const resP = await fetch('/api/people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: registerName.trim() }),
        });
        const jsonP = await parseJsonSafe(resP);
        if (!jsonP.ok) {
          alert(jsonP.error || 'Falha ao cadastrar pessoa.');
          return;
        }
        personId = jsonP.data.id;
      }
      const resV = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate: pendingPlate }),
      });
      const jsonV = await parseJsonSafe(resV);
      if (!jsonV.ok) {
        alert(jsonV.error || 'Falha ao cadastrar veículo.');
        return;
      }
      const resC = await fetch('/api/visits/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: jsonV.data.id, personId, purpose: 'despacho' }),
      });
      const jsonC = await parseJsonSafe(resC);
      if (!jsonC.ok) {
        alert(jsonC.error || 'Falha na entrada.');
        return;
      }
      setShowModal(false);
      setRegisterName('');
      setPendingPlate('');
      setInput('');
      await loadOpenVisits();
    } catch (e: any) {
      alert(e?.message ?? e);
    } finally {
      setRegistering(false);
    }
  };

  const onCheckout = async (visitId: string) => {
    setBusyVisitId(visitId);

    setOpenVisits((prev) => prev.filter((v) => v.id !== visitId));
    try {
      const res = await fetch(`/api/visits/${visitId}/checkout`, {
        method: 'POST',
        cache: 'no-store',
      });
      const json = await parseJsonSafe(res);
      if (!json.ok) {
        throw new Error(json.error || 'Falha na saída.');
      }



    } catch (e: any) {
      alert(e?.message ?? e);
    } finally {
      setBusyVisitId(null);
      await loadOpenVisits();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-center text-2xl font-semibold">Controle de Placas</h1>

        <div className="space-y-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: ABC1234"
            className="w-full rounded border px-3 py-2"
          />
          <button
            onClick={onVerify}
            className="w-full rounded bg-green-600 py-2 text-white"
          >
            Verificar
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-center text-xl font-medium">Placas em andamento</h2>
          <table className="w-full border-collapse bg-white text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">Placa</th>
                <th className="border p-2 text-left">Nome</th>
                <th className="border p-2 text-left">Entrada</th>
                <th className="border p-2 text-left">Saída</th>
              </tr>
            </thead>
            <tbody>
              {openVisits.map((v) => (
                <tr key={v.id}>
                  <td className="border p-2">{v.vehicles?.plate ?? '-'}</td>
                  <td className="border p-2">{v.people?.full_name ?? '-'}</td>
                  <td className="border p-2">{formatDateTime(v.checkin_time)}</td>
                  <td className="border p-2">
                    <button
                      onClick={() => onCheckout(v.id)}
                      className="rounded bg-red-600 px-3 py-1 text-white"
                      disabled={busyVisitId === v.id}
                    >
                      {busyVisitId === v.id ? 'Saindo...' : 'Saída'}
                    </button>
                  </td>
                </tr>
              ))}
              {openVisits.length === 0 && (
                <tr>
                  <td colSpan={4} className="border p-2 text-center text-gray-500">
                    {loadingVisits ? 'Carregando...' : 'Nenhuma placa em andamento.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="w-80 space-y-3 rounded bg-white p-4">
              <h2 className="text-lg font-medium">Cadastrar Placa</h2>
              <div>
                <label className="block text-sm">Placa</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={pendingPlate}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm">Nome (opcional)</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded border px-3 py-2"
                  disabled={registering}
                >
                  Cancelar
                </button>
                <button
                  onClick={onRegisterAndEntry}
                  className="rounded bg-green-600 px-4 py-2 text-white"
                  disabled={registering}
                >
                  {registering ? 'Salvando...' : 'Entrada'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
