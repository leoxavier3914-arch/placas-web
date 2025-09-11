'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Início" },
    { href: "/cadastro", label: "Cadastros" },
    { href: "/autorizados", label: "Autorizados" },
    { href: "/historico", label: "Histórico" },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-6 p-4">
        {links.map(({ href, label }) => {
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
        })}
      </div>
    </nav>
  );
}
