'use client';
import { useEffect, useState } from 'react';
import { normalizePlate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { parseJsonSafe } from '@/lib/api';
import OpenVisitsTable, { OpenVisit } from '@/components/OpenVisitsTable';
import RegisterModal from '@/components/RegisterModal';
import ConfirmModal from '@/components/ConfirmModal';
import AuthorizedModal from '@/components/AuthorizedModal';

export default function Home() {
  const [input, setInput] = useState('');
  const [openVisits, setOpenVisits] = useState<OpenVisit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [busyVisitId, setBusyVisitId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  // Modal de cadastro
  const [pendingPlate, setPendingPlate] = useState<string | null>(null);

  // Modal de confirmação para placas cadastradas
  const [confirmVehicle, setConfirmVehicle] = useState<
    { id: string; plate: string; model: string | null; color: string | null } | null
  >(null);
  const [confirmPeople, setConfirmPeople] = useState<
    { id: string; full_name: string | null }[]
  >([]);

  // Modal para placas apenas autorizadas
  const [authorizedInfo, setAuthorizedInfo] = useState<
    { plate: string; name: string; department: string } | null
  >(null);

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
    if (!plate) {
      toast.error('Formato de placa inválido.');
      return;
    }
    setPendingPlate(null);
    setConfirmVehicle(null);
    setConfirmPeople([]);
    setAuthorizedInfo(null);
    setChecking(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`/api/lookup/plate/${plate}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const json = await parseJsonSafe(res);
      if (json.ok === false) {
        toast.error(json.error || 'Erro na verificação da placa.');
        return;
      }
      if (json.type === 'registered') {
        const open = (json.visits || []).find((v: any) => !v.checkout_time);
        if (open) {
          toast.error('Placa já possui entrada em andamento.');
          return;
        }
        if (json.vehicle && typeof json.vehicle === 'object') {
          setConfirmVehicle({
            id: json.vehicle.id,
            plate: json.vehicle.plate,
            model: json.vehicle.model,
            color: json.vehicle.color,
          });
          setConfirmPeople(json.people || []);
          return;
        }
      }
      if (json.type === 'authorized') {
        setAuthorizedInfo(json.authorized);
        return;
      }
      setPendingPlate(plate);
    } catch (e: any) {
      if (e.name === 'AbortError') {
        toast.error('Tempo de consulta esgotado. Tente novamente.');
      } else {
        toast.error(e?.message ?? e);
      }
    } finally {
      setChecking(false);
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
      toast.error(e?.message ?? e);
    } finally {
      setBusyVisitId(null);
      await loadOpenVisits();
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-center">Controle de Placas</h1>
        <p className="mt-2 text-center">Digite a placa para verificar:</p>
        <div className="mt-4 flex flex-col items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: ABC1234"
            className="w-full max-w-xs rounded border px-3 py-2"
          />
          <button
            onClick={onVerify}
            disabled={checking}
            className="w-full max-w-xs rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {checking ? 'Consultando...' : 'Verificar'}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-medium text-center">Placas em andamento</h2>
        <OpenVisitsTable
          visits={openVisits}
          loading={loadingVisits}
          busyId={busyVisitId}
          onCheckout={onCheckout}
        />
      </section>

      {confirmVehicle && (
        <ConfirmModal
          vehicle={confirmVehicle}
          initialPeople={confirmPeople}
          onClose={() => {
            setConfirmVehicle(null);
            setConfirmPeople([]);
          }}
          onSuccess={async () => {
            setConfirmVehicle(null);
            setConfirmPeople([]);
            setInput('');
            await loadOpenVisits();
          }}
        />
      )}

      {authorizedInfo && (
        <AuthorizedModal
          info={authorizedInfo}
          onClose={() => setAuthorizedInfo(null)}
        />
      )}

      {pendingPlate && (
        <RegisterModal
          plate={pendingPlate}
          onClose={() => setPendingPlate(null)}
          onSuccess={async () => {
            setPendingPlate(null);
            setInput('');
            await loadOpenVisits();
          }}
        />
      )}
    </div>
  );
}
