'use client';
import { useState } from 'react';
import { normalizePlate } from '@/lib/utils';

type Visit = { id: string; checkin_time: string; checkout_time: string | null };

export default function Home() {
  const [input, setInput] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busyVisitId, setBusyVisitId] = useState<string | null>(null);

  const onLookup = async () => {
    const plate = normalizePlate(input);
    if (!plate) return;
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/lookup/plate/${plate}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  const onCheckin = async () => {
    if (!data?.vehicle && !data?.person) return;
    setCreating(true);
    try {
      const res = await fetch('/api/visits/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: data?.person?.id ?? null,
          vehicleId: data?.vehicle?.id ?? null,
          purpose: 'despacho',
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        alert(`Falhou: ${json.error}`);
        return;
      }
      alert('Check-in feito!');
      // Recarrega a busca para atualizar a lista de visitas
      onLookup();
    } finally {
      setCreating(false);
    }
  };

  const onCheckout = async (visitId: string) => {
    setBusyVisitId(visitId);
    try {
      const res = await fetch(`/api/visits/${visitId}/checkout`, { method: 'POST' });
      const json = await res.json();
      if (!json.ok) {
        alert(`Falhou: ${json.error}`);
        return;
      }
      alert('Checkout feito!');
      onLookup();
    } finally {
      setBusyVisitId(null);
    }
  };

  const onPdf = async (visitId: string) => {
    setBusyVisitId(visitId);
    try {
      const res = await fetch(`/api/pdf/visit/${visitId}`, { method: 'POST' });
      const json = await res.json();
      if (!json.ok) {
        alert(`PDF falhou: ${json.error}`);
        return;
      }
      // Abre o PDF em nova aba (no celular abre o viewer)
      window.open(json.url, '_blank');
    } finally {
      setBusyVisitId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Portaria — Verificar Placa/Documento</h1>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite a placa (AAA0A00)"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          onClick={onLookup}
          className="rounded bg-blue-600 px-4 py-2 text-white"
          disabled={loading}
        >
          {loading ? 'Buscando...' : 'Verificar'}
        </button>
      </div>

      {data && (
        <div className="rounded border bg-white p-3">
          {!data.found && <p>Não encontrado. Cadastre a pessoa/veículo.</p>}

          {data.found && (
            <>
              <p><b>Veículo:</b> {data.vehicle?.plate ?? '-'}</p>
              <p><b>Pessoa:</b> {data.person?.full_name ?? '-'}</p>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={onCheckin}
                  className="rounded bg-green-600 px-3 py-2 text-white"
                  disabled={creating}
                >
                  {creating ? 'Registrando...' : 'Fazer Check-in'}
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <b>Visitas desta placa (filial atual):</b>
                <ul className="space-y-2">
                  {(data.visits ?? []).map((v: Visit) => {
                    const aberta = !v.checkout_time;
                    return (
                      <li key={v.id} className="rounded border p-2">
                        <div className="text-sm">
                          <div><b>Entrada:</b> {new Date(v.checkin_time).toLocaleString()}</div>
                          <div>
                            <b>Status:</b> {aberta ? 'Em andamento' : `Saiu: ${new Date(v.checkout_time!).toLocaleString()}`}
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          {aberta && (
                            <button
                              onClick={() => onCheckout(v.id)}
                              className="rounded bg-amber-600 px-3 py-1 text-white"
                              disabled={busyVisitId === v.id}
                            >
                              {busyVisitId === v.id ? 'Finalizando...' : 'Checkout'}
                            </button>
                          )}
                          <button
                            onClick={() => onPdf(v.id)}
                            className="rounded bg-gray-700 px-3 py-1 text-white"
                            disabled={busyVisitId === v.id}
                          >
                            {busyVisitId === v.id ? 'Gerando...' : 'PDF'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
