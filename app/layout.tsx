import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl p-4">{children}</div>
      </body>
    </html>
  );
}
