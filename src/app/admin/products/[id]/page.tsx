"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import ProductImageManager from "@/components/ProductImageManager";
import DecreaseStockButton from "@/components/DecreaseStockButton";

type Product = {
  id: number;
  nombre?: string | null;
  precio?: number | null;
  stock?: number | null;
  imagenUrl?: string | null;
  imagenPublicId?: string | null;
  // agrega aquí otros campos que tengas en tu backend
};

export default function AdminProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

const load = async () => {
  setLoading(true);
  setErr(null);
  try {
    const { data } = await api.get<Product>(`/products/${params.id}`);
    setProduct(data); // ✅ ya no es unknown
  } catch (e: any) {
    setErr(e?.response?.data?.message || "Error cargando producto");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (params?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  if (loading) return <div className="p-6">Cargando producto...</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!product) return <div className="p-6">No se encontró el producto.</div>;

  return (
    <div className="p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Editar producto #{product.id}</h1>
        <p className="text-sm text-gray-600">
          {product.nombre ?? "(sin nombre)"} · Stock: {product.stock ?? 0} · Precio:{" "}
          {product.precio ?? "-"}
        </p>
      </header>

      {/* Gestión de imagen */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Imagen</h2>
        <ProductImageManager
          productId={product.id}
          imagenUrl={product.imagenUrl}
          imagenPublicId={product.imagenPublicId}
          onChanged={load} // recarga tras subir/borrar
        />
      </section>

      {/* Movimiento de stock (salida) */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Inventario</h2>
        <div className="flex items-center gap-4">
          <DecreaseStockButton productId={product.id} onChanged={load} />
          <button
            onClick={() => router.refresh()}
            className="px-3 py-2 rounded border"
            title="Forzar refresco de la ruta"
          >
            Refrescar
          </button>
        </div>
      </section>
    </div>
  );
}
