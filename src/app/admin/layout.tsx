'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();  // 👈 ahora también logout
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;                 
    if (!user) {
      router.replace('/auth/login');     
      return;
    }
    if (user.rol !== 'admin') {
      router.replace('/');               
    }
  }, [user, loading, router]);

  if (loading || !user || user.rol !== 'admin') {
    return (
      <div className="min-h-screen bg-background-light text-neutral">
        <header className="sticky top-0 z-10 w-full bg-primary text-white">
          <div className="mx-auto max-w-6xl p-4">Mercado Cafetero</div>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-6">
          <div className="animate-pulse rounded-lg border bg-white p-6">Cargando…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light text-neutral">
      <header className="sticky top-0 z-10 w-full bg-primary text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Link href="/" className="font-semibold">Mercado Cafetero</Link>
          <nav className="flex items-center gap-2 text-sm">
            <NavItem href="/admin/products" pathname={pathname}>Productos</NavItem>
            {/* 👇 Botón simple para cerrar sesión */}
            <button
              onClick={logout}
              className="rounded-full px-3 py-1 hover:bg-white/10 transition"
            >
              Cerrar sesión
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}

function NavItem({
  href,
  pathname,
  children,
}: {
  href: string;
  pathname: string | null;
  children: React.ReactNode;
}) {
  const active = pathname?.startsWith(href);
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 transition ${active ? 'bg-white/15' : 'hover:bg-white/10'}`}
    >
      {children}
    </Link>
  );
}
