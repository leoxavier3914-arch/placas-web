'use client';

import React from 'react';

export type OpenVisit = {
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

interface Props {
  visits: OpenVisit[];
  loading: boolean;
  busyId: string | null;
  onCheckout: (id: string) => void;
}

export default function OpenVisitsTable({ visits, loading, busyId, onCheckout }: Props) {
  return (
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
          {visits.map((v) => (
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
                  disabled={busyId === v.id}
                >
                  {busyId === v.id ? 'Saindo...' : 'Saída'}
                </button>
              </td>
            </tr>
          ))}
          {visits.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="border border-gray-300 p-2 text-center text-gray-500"
              >
                {loading ? 'Carregando...' : 'Nenhuma placa em andamento.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

