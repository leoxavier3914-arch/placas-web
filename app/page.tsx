'use client';
import { useState } from 'react';
import { normalizePlate } from '@/lib/utils';

type Visit = { id: string; checkin_time: string; checkout_time: string | null };

export default function Home() {
  const [input, setInput] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

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
      alert(json.ok ? 'Check-in feito!' : `Falhou: ${json.error}`);
    } finally {
      setCreating(false);
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

              <div className="mt-4">
                <b>Últimas visitas (desta filial):</b>
                <ul className="list-disc pl-6">
                  {(data.visits ?? []).map((v: Visit) => (
                    <li key={v.id}>
                      {new Date(v.checkin_time).toLocaleString()} —{' '}
                      {v.checkout_time ? `Saiu: ${new Date(v.checkout_time).toLocaleString()}` : 'Em andamento'}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
