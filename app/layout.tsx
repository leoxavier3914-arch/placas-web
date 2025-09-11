import "./globals.css";
import Nav from "@/components/Nav";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col bg-gray-50">
        {/* Barra de navegação */}
        <Nav />
        {/* Conteúdo da página */}
        <main className="flex flex-1 w-full flex-col items-center p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
