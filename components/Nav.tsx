'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Início" },
    { href: "/cadastro", label: "Cadastros" },
    { href: "/historico", label: "Histórico" },
  ];

  return (
    <nav className="bg-white shadow px-4 py-3">
      <div className="mx-auto max-w-3xl flex gap-4">
        {links.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`font-medium hover:underline ${
                active ? "text-blue-800" : "text-blue-600"
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
