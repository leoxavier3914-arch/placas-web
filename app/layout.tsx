import "./globals.css";
import Nav from "@/components/Nav";
import Toast from "@/components/Toast";
import { Roboto } from "next/font/google";

const roboto = Roboto({ subsets: ["latin"], weight: "400" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${roboto.className} flex min-h-screen flex-col`}>
        {/* Barra de navegação */}
        <Nav />
        {/* Contêiner de toasts */}
        <Toast />
        {/* Conteúdo da página */}
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
