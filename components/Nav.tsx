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
    <nav className="bg-white shadow">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-4 px-4 py-3">
        {links.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`font-medium transition-colors hover:text-blue-800 hover:underline ${
                active
                  ? "text-blue-800 underline decoration-2 underline-offset-4"
                  : "text-blue-600"
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
