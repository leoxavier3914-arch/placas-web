'use client';

interface Info {
  plate: string;
  name: string;
  department: string;
}

interface Props {
  info: Info;
  onClose: () => void;
}

export default function AuthorizedModal({ info, onClose }: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="w-80 space-y-2 rounded bg-white p-4">
        <h2 className="text-lg font-medium text-green-600">AUTORIZADO</h2>
        <p>
          <strong>Placa:</strong> {info.plate}
        </p>
        <p>
          <strong>Nome:</strong> {info.name}
        </p>
        <p>
          <strong>Departamento:</strong> {info.department}
        </p>
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="rounded bg-blue-600 px-4 py-2 text-white">
            Ok
          </button>
        </div>
      </div>
    </div>
  );
}

