'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type Estado = 'ACTIVO' | 'INACTIVO' | 'AGOTADO';

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  stockMinimo?: number;
  imagenUrl?: string | null;
  categoria: string;
  subcategoria?: string | null;
  marca?: string | null;
  estado: Estado;
};

export default function UserHomePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr(null);
        // Trae todos del backend y filtra solo ACTIVO para el usuario final
        const { data } = await api.get<Producto[]>('/productos');
        setItems((data ?? []).filter((p) => p.estado === 'ACTIVO'));
      } catch (e: any) {
        setErr(e?.response?.data?.message || 'No se pudieron cargar los productos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-lg border bg-white p-5">
        <h1 className="text-2xl font-semibold">¡Bienvenido{user?.nombre ? `, ${user.nombre}` : ''}!</h1>
        <p className="mt-1 text-sm text-gray-600">
          Estos son los productos disponibles hoy.
        </p>
      </div>

      {loading && <div className="animate-pulse rounded-lg border bg-white p-6">Cargando…</div>}
      {err && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{err}</div>
      )}

      {!loading && !err && (
        items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
            No hay productos disponibles por el momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <article key={p.id} className="rounded-lg border bg-white p-4">
                <div className="mb-3 h-40 w-full overflow-hidden rounded bg-gray-100">
                  {p.imagenUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imagenUrl}
                      alt={p.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                      Sin imagen
                    </div>
                  )}
                </div>
                <h3 className="line-clamp-1 text-base font-semibold">{p.nombre}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">{p.descripcion}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-bold">{currencyCOP(p.precio)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.stock > 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.stock > 0 ? `Stock: ${p.stock}` : 'Agotado'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )
      )}
    </section>
  );
}

function currencyCOP(n: number) {
  try {
    return Number(n ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
  } catch {
    return `$ ${Number(n ?? 0).toLocaleString()}`;
  }
}
