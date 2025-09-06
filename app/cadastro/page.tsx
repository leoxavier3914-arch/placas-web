'use client';
import { useState } from 'react';
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
  const [vModel, setVModel] = useState('');
  const [vColor, setVColor] = useState('');
  const [vLoading, setVLoading] = useState(false);

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
        alert(json.error);
        return;
      }
      alert('Pessoa cadastrada com sucesso!');
      setPFullName('');
      setPDoc('');
      setPPhone('');
      setPEmail('');
      setPNotes('');
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
        alert(json.error);
        return;
      }
      alert('Veículo cadastrado com sucesso!');
      setVPlate('');
      setVModel('');
      setVColor('');
    } catch (e: any) {
      alert(`Falha: ${e?.message ?? e}`);
    } finally {
      setVLoading(false);
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
    </div>
  );
}
