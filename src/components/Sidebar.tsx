'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Panel', icon: 'grid' },
  { href: '/pos', label: 'Venta rapida (POS)', icon: 'cart' },
  { href: '/productos', label: 'Productos', icon: 'box' },
  { href: '/inventario', label: 'Inventario y lotes', icon: 'layers' },
  { href: '/compras', label: 'Compras', icon: 'truck' },
  { href: '/proveedores', label: 'Proveedores', icon: 'users' },
  { href: '/importar', label: 'Carga desde Excel', icon: 'upload' },
  { href: '/reportes', label: 'Reportes', icon: 'chart' },
  { href: '/reportes/kardex', label: 'Kardex', icon: 'list' },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 hidden md:flex w-60 flex-col bg-slate-900 text-slate-300">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="text-xl font-bold text-white">Botica<span className="text-brand-light">Pro</span></div>
        <div className="text-xs text-slate-400">Sistema de gestion</div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map((n) => {
          const active = n.href === '/' ? path === '/' : path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? 'bg-brand text-white' : 'hover:bg-slate-800 hover:text-white'
              }`}>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-slate-500 border-t border-slate-800">v1.0 · Demo</div>
    </aside>
  );
}
