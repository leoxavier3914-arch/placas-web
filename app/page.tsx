'use client';
import { useEffect, useState } from 'react';
import { normalizePlate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { parseJsonSafe } from '@/lib/api';

type OpenVisit = {
  id: string;
  checkin_time: string;
  people: { full_name: string | null } | null;
  vehicles: { plate: string | null } | null;
};

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
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

  // Modal de confirmação para placas cadastradas
  const [confirmVehicle, setConfirmVehicle] = useState<
    { id: string; plate: string; model: string | null; color: string | null } | null
  >(null);
  const [confirmPeople, setConfirmPeople] = useState<
    { id: string; full_name: string | null }[]
  >([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [newPersonName, setNewPersonName] = useState('');
  const [linking, setLinking] = useState(false);
  const [confirmPurpose, setConfirmPurpose] = useState('despacho');
  const [entering, setEntering] = useState(false);

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

  const onLinkPerson = async () => {
    if (!confirmVehicle || !newPersonName.trim()) return;
    setLinking(true);
    try {
      const resP = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: newPersonName.trim() }),
      });
      const jsonP = await parseJsonSafe(resP);
      if (!jsonP.ok) {
        toast.error(jsonP.error || 'Falha ao cadastrar pessoa.');
        return;
      }
      const personId = jsonP.data.id;
      const resL = await fetch('/api/vehicle-people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: confirmVehicle.id, personId }),
      });
      const jsonL = await parseJsonSafe(resL);
      if (!jsonL.ok) {
        toast.error(jsonL.error || 'Falha ao vincular pessoa.');
        return;
      }
      setConfirmPeople((prev) => [...prev, { id: personId, full_name: jsonP.data.full_name }]);
      setSelectedPersonId(personId);
      setNewPersonName('');
    } catch (e: any) {
      toast.error(e?.message ?? e);
    } finally {
      setLinking(false);
    }
  };

  const onUnlinkPerson = async (personId: string) => {
    if (!confirmVehicle) return;
    try {
      const res = await fetch('/api/vehicle-people', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: confirmVehicle.id, personId }),
      });
      const json = await parseJsonSafe(res);
      if (!json.ok) {
        toast.error(json.error || 'Falha ao desvincular.');
        return;
      }
      setConfirmPeople((prev) => prev.filter((p) => p.id !== personId));
      if (selectedPersonId === personId) setSelectedPersonId(null);
    } catch (e: any) {
      toast.error(e?.message ?? e);
    }
  };

  useEffect(() => {
    loadOpenVisits();
  }, []);

  const onVerify = async () => {
    const plate = normalizePlate(input);
    if (!plate) return;
    setShowModal(false);
    setConfirmVehicle(null);
    setConfirmPeople([]);
    setSelectedPersonId(null);
    setNewPersonName('');
    setAuthorizedInfo(null);
    try {
      const res = await fetch(`/api/lookup/plate/${plate}`, { cache: 'no-store' });
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
          setSelectedPersonId(json.people?.[0]?.id || null);
          setNewPersonName('');
          setConfirmPurpose('despacho');
          return;
        }
      }
      if (json.type === 'authorized') {
        setAuthorizedInfo(json.authorized);
        return;
      }
      setPendingPlate(plate);
      setShowModal(true);
    } catch (e: any) {
      toast.error(e?.message ?? e);
    }
  };

  const onEntryConfirm = async () => {
    if (!confirmVehicle) return;
    if (!selectedPersonId) {
      toast.error('Selecione ou cadastre uma pessoa vinculada.');
      return;
    }
    setEntering(true);
    try {
      const resCheck = await fetch('/api/visits/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: confirmVehicle.id,
          personId: selectedPersonId,
          purpose: confirmPurpose,
        }),
      });
      const jsonCheck = await parseJsonSafe(resCheck);
      if (!jsonCheck.ok) {
        toast.error(jsonCheck.error || 'Falha na entrada.');
        return;
      }
      setConfirmVehicle(null);
      setConfirmPeople([]);
      setSelectedPersonId(null);
      setNewPersonName('');
      setConfirmPurpose('despacho');
      setInput('');
      await loadOpenVisits();
    } catch (e: any) {
      toast.error(e?.message ?? e);
    } finally {
      setEntering(false);
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
          toast.error(jsonP.error || 'Falha ao cadastrar pessoa.');
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
        toast.error(jsonV.error || 'Falha ao cadastrar veículo.');
        return;
      }
      if (personId) {
        const resLink = await fetch('/api/vehicle-people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleId: jsonV.data.id, personId }),
        });
        const jsonLink = await parseJsonSafe(resLink);
        if (!jsonLink.ok) {
          toast.error(jsonLink.error || 'Falha ao vincular pessoa.');
          return;
        }
      }
      const resC = await fetch('/api/visits/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: jsonV.data.id, personId, purpose: 'despacho' }),
      });
      const jsonC = await parseJsonSafe(resC);
      if (!jsonC.ok) {
        toast.error(jsonC.error || 'Falha na entrada.');
        return;
      }
      setShowModal(false);
      setRegisterName('');
      setPendingPlate('');
      setInput('');
      await loadOpenVisits();
    } catch (e: any) {
      toast.error(e?.message ?? e);
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
            className="w-full max-w-xs rounded bg-green-600 px-4 py-2 text-white"
          >
            Verificar
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-medium text-center">Placas em andamento</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2 text-center">Placa</th>
                <th className="border border-gray-300 p-2 text-center">Nome</th>
                <th className="border border-gray-300 p-2 text-center">Entrada</th>
                <th className="border border-gray-300 p-2 text-center">Saída</th>
              </tr>
            </thead>
            <tbody>
              {openVisits.map((v) => (
                <tr key={v.id}>
                  <td className="border border-gray-300 p-2 text-center">
                    {v.vehicles?.plate ?? '-'}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {v.people?.full_name ?? '-'}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {formatTime(v.checkin_time)}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
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
                  <td
                    colSpan={4}
                    className="border border-gray-300 p-2 text-center text-gray-500"
                  >
                    {loadingVisits
                      ? 'Carregando...'
                      : 'Nenhuma placa em andamento.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

        {confirmVehicle && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="w-80 space-y-3 rounded bg-white p-4">
              <h2 className="text-lg font-medium text-green-600">CADASTRADO</h2>
              <div>
                <label className="block text-sm">Placa</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={confirmVehicle.plate}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm">Modelo</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={confirmVehicle.model ?? ''}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm">Cor</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={confirmVehicle.color ?? ''}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm">Nome</label>
                {confirmPeople.length > 0 ? (
                  <select
                    className="w-full rounded border px-3 py-2"
                    value={selectedPersonId ?? ''}
                    onChange={(e) =>
                      setSelectedPersonId(e.target.value || null)
                    }
                  >
                    <option value="">Selecione</option>
                    {confirmPeople.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma pessoa vinculada.</p>
                )}
                {confirmPeople.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {confirmPeople.map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span>{p.full_name}</span>
                        <button
                          onClick={() => onUnlinkPerson(p.id)}
                          className="text-red-600"
                        >
                          Desvincular
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-sm">Adicionar nova pessoa</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded border px-3 py-2"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                  />
                  <button
                    onClick={onLinkPerson}
                    className="rounded bg-blue-600 px-3 py-2 text-white"
                    disabled={linking}
                  >
                    {linking ? 'Vinculando...' : 'Vincular'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm">Finalidade</label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={confirmPurpose}
                  onChange={(e) => setConfirmPurpose(e.target.value)}
                >
                  <option value="despacho">Despacho</option>
                  <option value="retirada">Retiro</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setConfirmVehicle(null);
                    setConfirmPeople([]);
                    setSelectedPersonId(null);
                    setNewPersonName('');
                    setConfirmPurpose('despacho');
                  }}
                  className="rounded border px-3 py-2"
                  disabled={entering}
                >
                  Cancelar
                </button>
                <button
                  onClick={onEntryConfirm}
                  className="rounded bg-green-600 px-4 py-2 text-white"
                  disabled={entering}
                >
                  {entering ? 'Entrando...' : 'Entrada'}
                </button>
              </div>
            </div>
          </div>
        )}

        {authorizedInfo && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="w-80 space-y-2 rounded bg-white p-4">
              <h2 className="text-lg font-medium text-green-600">AUTORIZADO</h2>
              <p><strong>Placa:</strong> {authorizedInfo.plate}</p>
              <p><strong>Nome:</strong> {authorizedInfo.name}</p>
              <p><strong>Departamento:</strong> {authorizedInfo.department}</p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setAuthorizedInfo(null)}
                  className="rounded bg-blue-600 px-4 py-2 text-white"
                >
                  Ok
                </button>
              </div>
            </div>
          </div>
        )}

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
  );
}
