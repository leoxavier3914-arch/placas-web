import "./globals.css";
import Nav from "@/components/Nav";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50">
        {/* Barra de navegação */}
        <Nav />
        {/* Conteúdo da página */}
        <main className="mx-auto max-w-3xl p-4">{children}</main>
      </body>
    </html>
  );
}
