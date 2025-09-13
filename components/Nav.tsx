'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Início" },
    { href: "/veiculos", label: "Veículos" },
    { href: "/visitantes", label: "Visitantes" },
    { href: "/autorizados", label: "Autorizados" },
    { href: "/historico", label: "Histórico" },
  ];

  const renderLinks = () =>
    links.map(({ href, label }) => {
      const active = pathname === href;
      return (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          onClick={() => setOpen(false)}
          className={`block rounded px-3 py-2 text-sm font-medium transition-colors ${
            active ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          {label}
        </Link>
      );
    });

  return (
    <>
      <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow">
        <div className="mx-auto max-w-5xl p-4">
          <button
            onClick={() => setOpen(true)}
            className="space-y-1"
            aria-label="Abrir menu"
          >
            <span className="block h-0.5 w-6 bg-white"></span>
            <span className="block h-0.5 w-6 bg-white"></span>
            <span className="block h-0.5 w-6 bg-white"></span>
          </button>
        </div>
      </nav>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 p-6 text-white shadow-lg">
            <div className="mb-6 flex justify-end">
              <button onClick={() => setOpen(false)} aria-label="Fechar menu">
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-2">{renderLinks()}</div>
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setOpen(false)}
          ></div>
        </div>
      )}
    </>
  );
}

