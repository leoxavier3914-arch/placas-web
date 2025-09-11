'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Início" },
    { href: "/cadastro", label: "Cadastros" },
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
          className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
            active ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          {label}
        </Link>
      );
    });

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow">
      <div className="mx-auto max-w-5xl p-4">
        <div className="flex items-center justify-between md:justify-center">
          <button
            onClick={() => setOpen((v) => !v)}
            className="space-y-1 md:hidden"
            aria-label="Abrir menu"
          >
            <span className="block h-0.5 w-6 bg-white"></span>
            <span className="block h-0.5 w-6 bg-white"></span>
            <span className="block h-0.5 w-6 bg-white"></span>
          </button>
          <div className="hidden gap-6 md:flex">{renderLinks()}</div>
        </div>
        {open && (
          <div className="mt-4 flex flex-col items-center gap-4 md:hidden">
            {renderLinks()}
          </div>
        )}
      </div>
    </nav>
  );
}
