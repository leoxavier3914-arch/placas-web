import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50">
        {/* Barra de navegação */}
        <nav className="bg-white shadow px-4 py-3">
          <div className="mx-auto max-w-3xl flex gap-4">
            <Link href="/" className="text-blue-600 font-medium hover:underline">
              Início
            </Link>
            <Link href="/cadastro" className="text-blue-600 font-medium hover:underline">
              Cadastros
            </Link>
          </div>
        </nav>

        {/* Conteúdo da página */}
        <main className="mx-auto max-w-3xl p-4">{children}</main>
      </body>
    </html>
  );
}
