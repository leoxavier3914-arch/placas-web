'use client';

import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { apiFetch, parseJsonSafe } from '@/lib/api';
import { Person } from '@/types';

interface Props {
  person: Person;
  onUpdated: () => Promise<void> | void;
}

export default function PersonAvatar({ person, onUpdated }: Props) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const ext = file.name.split('.').pop();
      const filePath = `${person.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('people')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('people').getPublicUrl(filePath);
      const photoUrl = data.publicUrl;
      const res = await apiFetch(`/api/people/${person.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: photoUrl }),
      });
      const json = await parseJsonSafe<{ ok: boolean; error?: string }>(res);
      if (!json.ok) {
        toast.error(json.error || 'Falha ao salvar foto.');
        return;
      }
      toast.success('Foto atualizada.');
      await onUpdated();
    } catch (err) {
      console.error(err);
      toast.error('Falha ao enviar foto.');
    } finally {
      setLoading(false);
      if (galleryRef.current) galleryRef.current.value = '';
      if (cameraRef.current) cameraRef.current.value = '';
    }
  };

  return (
    <div className="ml-4 flex h-16 w-16 items-center justify-center">
      {person.photo_url ? (
        <img
          src={person.photo_url}
          alt={person.full_name}
          className="h-16 w-16 cursor-pointer rounded-full object-cover"
          onClick={() => !loading && setShowOptions(true)}
        />
      ) : (
        <div
          className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-2xl text-gray-500"
          onClick={() => !loading && setShowOptions(true)}
        >
          {loading ? '...' : '+'}
        </div>
      )}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        disabled={loading}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
        disabled={loading}
      />
      {showOptions && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="w-64 space-y-3 rounded bg-white p-4">
            <button
              onClick={() => {
                cameraRef.current?.click();
                setShowOptions(false);
              }}
              className="w-full rounded bg-blue-600 px-4 py-2 text-white"
            >
              Tirar Foto
            </button>
            <button
              onClick={() => {
                galleryRef.current?.click();
                setShowOptions(false);
              }}
              className="w-full rounded bg-green-600 px-4 py-2 text-white"
            >
              Galeria
            </button>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowOptions(false)}
                className="rounded border px-3 py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
