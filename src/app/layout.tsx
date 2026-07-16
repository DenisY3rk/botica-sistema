import './globals.css';
import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'BoticaPro - Sistema para boticas',
  description: 'Gestion de productos, stock por lotes, ventas y reportes para boticas del Peru',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 md:ml-60 p-4 md:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
