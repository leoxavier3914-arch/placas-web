'use client';

import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { parseJsonSafe, apiFetch } from '@/lib/api';
import { Person } from '@/types';

export default function VisitantesPage() {
  const [people, setPeople] = useState<Person[]>([]);

  const loadPeople = async () => {
    try {
      const res = await apiFetch('/api/people', { cache: 'no-store' });
      const json = await parseJsonSafe<{ data?: Person[] }>(res).catch(() => null);
      if (res.ok && json?.data) setPeople(json.data);
    } catch (e) {
      logError('loadPeople', e);
      toast.error('Falha ao carregar pessoas.');
    }
  };

  useEffect(() => {
    loadPeople();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Visitantes</h1>
      {people.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma pessoa cadastrada.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {people.map((p) => (
            <div key={p.id} className="rounded-lg bg-white p-4 shadow">
              <p className="font-medium">{p.full_name}</p>
              {p.doc_number && (
                <p className="text-sm text-gray-600">{p.doc_number}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

