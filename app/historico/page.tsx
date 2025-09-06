'use client';
import { useEffect, useState } from 'react';

type Item = {
  id: string;
  checkin_time: string;
  checkout_time: string | null;
  purpose: string | null;
  people: { full_name: string | null } | null;
  vehicles: { plate: string | null } | null;
  branches: { name: string | null } | null;
};

type ApiResp = {
  ok: boolean;
  error?: string;
  data?: Item[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
};

async function parseJsonSafe(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `Servidor retornou ${res.status} sem JSON.`);
  }
  return res.json();
}

export default function HistoricoPage() {
  // filtros
  const [start, setStart] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // dados
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start, end, page: String(p), pageSize: String(pageSize),
      });
      const res = await fetch(`/api/visits/history?${params.toString()}`);
      const json = (await parseJsonSafe(res)) as ApiResp;
      if (!json.ok) {
        alert(json.error || 'Falha ao consultar histórico.');
        return;
      }
      setItems(json.data || []);
      setPage(json.page || 1);
      setTotalPages(json.totalPages || 1);
    } catch (e: any) {
      alert(e?.message ?? e);
    } finally {
      setLoading(false);
    }
  };

  const onSearch = () => load(1);

  const onPdfReport = async () => {
    try {
      const params = new URLSearchParams({ start, end });
      const res = await fetch(`/api/pdf/history?${params.toString()}`, { method: 'POST' });
      const json = await parseJsonSafe(res);
      if (!json.ok || !json.url) {
        alert(json.error ?? 'Falha ao gerar relatório');
        return;
      }
      window.location.href = json.url; // abre no mobile
    } catch (e: any) {
      alert(e?.message ?? e);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Histórico — Filial Atual</h1>

      {/* Filtros */}
      <div className="rounded border bg-white p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-sm">Início</label>
            <input
              type="date"
              className="w-full rounded border px-3 py-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm">Fim</label>
            <input
              type="date"
              className="w-full rounded border px-3 py-2"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={onSearch}
              className="w-full rounded bg-blue-600 px-4 py-2 text-white"
              disabled={loading}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={onPdfReport}
              className="w-full rounded bg-gray-700 px-4 py-2 text-white"
              disabled={loading}
            >
              Gerar Relatório PDF
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {items.length === 0 && (
          <div className="rounded border bg-white p-3 text-sm">Nenhum registro no período.</div>
        )}

        {items.map((v) => {
          const status = v.checkout_time
            ? `Saída: ${new Date(v.checkout_time).toLocaleString()}`
            : 'Em andamento';
          return (
            <div key={v.id} className="rounded border bg-white p-3">
              <div className="text-sm">
                <div><b>Entrada:</b> {new Date(v.checkin_time).toLocaleString()}</div>
                <div><b>{status}</b></div>
                <div><b>Placa:</b> {v.vehicles?.plate ?? '-'}</div>
                <div><b>Pessoa:</b> {v.people?.full_name ?? '-'}</div>
                <div><b>Filial:</b> {v.branches?.name ?? '-'}</div>
                <div><b>Finalidade:</b> {v.purpose ?? '-'}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <button
          className="rounded border px-3 py-1 disabled:opacity-50"
          onClick={() => load(page - 1)}
          disabled={loading || page <= 1}
        >
          Anterior
        </button>
        <div className="text-sm">Página <b>{page}</b> de <b>{totalPages}</b></div>
        <button
          className="rounded border px-3 py-1 disabled:opacity-50"
          onClick={() => load(page + 1)}
          disabled={loading || page >= totalPages}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
