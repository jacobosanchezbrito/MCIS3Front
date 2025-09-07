'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

type Estado = 'ACTIVO' | 'INACTIVO' | 'AGOTADO';

export default function ProductsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Crear (form abajo)
  const [createOpen, setCreateOpen] = useState(false);
  const [cargandoCrear, setCargandoCrear] = useState(false);
  const [nuevo, setNuevo] = useState<any>({
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    categoria: '',
    subcategoria: '',
    marca: '',
    estado: 'ACTIVO' as Estado,
    stockMinimo: 0,
  });
  const [nuevoArchivo, setNuevoArchivo] = useState<File | null>(null);

  // Editar (panel simple en la misma página)
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any | null>(null);
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  // --------- Utilidades ----------
  function currencyCOP(n: any) {
    const val = Number(n ?? 0);
    try {
      return val.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    } catch {
      return `$ ${val.toLocaleString()}`;
    }
  }

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await api.get<any[]>('/productos');
      setItems(res.data ?? []);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // --------- Crear ----------
  async function onCrear(e: React.FormEvent) {
    e.preventDefault();
    try {
      setCargandoCrear(true);
      const payload = {
        ...nuevo,
        precio: Number(nuevo.precio ?? 0),
        stock: Number(nuevo.stock ?? 0),
        stockMinimo: Number(nuevo.stockMinimo ?? 0),
      };

      // 1) Crear producto base (sin imagenUrl manual)
      const res = await api.post<any>('/productos', payload); // requiere admin
      let creado = res.data;

      // 2) Si adjuntaste archivo, subir imagen
      if (nuevoArchivo) {
        const form = new FormData();
        form.append('file', nuevoArchivo);
        const up = await api.post<{ imagenUrl: string; imagenPublicId?: string }>(
          `/productos/${creado.id}/imagen`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        creado = { ...creado, imagenUrl: up.data.imagenUrl };
      }

      // 3) Agregar a la tabla
      setItems((prev) => [creado, ...prev]);

      // 4) Reset
      setNuevo({
        nombre: '',
        descripcion: '',
        precio: 0,
        stock: 0,
        categoria: '',
        subcategoria: '',
        marca: '',
        estado: 'ACTIVO' as Estado,
        stockMinimo: 0,
      });
      setNuevoArchivo(null);
      setCreateOpen(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo crear');
    } finally {
      setCargandoCrear(false);
    }
  }

  // --------- Eliminar ----------
  async function onEliminar(id: number) {
    const ok = confirm('¿Eliminar este producto? Esta acción es irreversible.');
    if (!ok) return;
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== id));
    try {
      await api.delete(`/productos/${id}`); // requiere rol admin
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo eliminar');
      setItems(prev);
    }
  }

  // --------- Editar ----------
  function abrirEditar(p: any) {
    setEditId(p.id);
    setEditData({
      nombre: p.nombre ?? '',
      descripcion: p.descripcion ?? '',
      precio: p.precio ?? 0,
      stock: p.stock ?? 0,
      categoria: p.categoria ?? '',
      subcategoria: p.subcategoria ?? '',
      marca: p.marca ?? '',
      imagenUrl: p.imagenUrl ?? '',
      estado: (p.estado ?? 'ACTIVO') as Estado,
      stockMinimo: p.stockMinimo ?? 0,
    });
  }

  async function onGuardarEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !editData) return;
    try {
      setGuardandoEdit(true);
      const payload = {
        ...editData,
        precio: Number(editData.precio ?? 0),
        stock: Number(editData.stock ?? 0),
        stockMinimo: Number(editData.stockMinimo ?? 0),
        imagenUrl: undefined, // no la actualizamos aquí
      };
      const { data: actualizado } = await api.patch(`/productos/${editId}`, payload); // admin
      setItems((arr) => arr.map((x) => (x.id === editId ? actualizado : x)));
      setEditId(null);
      setEditData(null);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo guardar');
    } finally {
      setGuardandoEdit(false);
    }
  }

  // --------- Cambiar imagen ----------
  async function onCambiarImagen(p: any, file: File) {
    try {
      const form = new FormData();
      form.append('file', file);

      const { data } = await api.post<{
        message: string;
        imagenUrl: string;
        imagenPublicId?: string;
      }>(`/productos/${p.id}/imagen`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setItems((arr) =>
        arr.map((x) => (x.id === p.id ? { ...x, imagenUrl: data.imagenUrl } : x))
      );
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error subiendo imagen');
    }
  }

  const empty = !loading && !err && items.length === 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <button
          onClick={() => setCreateOpen((v) => !v)}
          className="rounded-lg bg-primary px-4 py-2 text-black hover:opacity-90"
        >
          {createOpen ? 'Cerrar' : '+ Nuevo'}
        </button>
      </div>

      {loading && <div className="animate-pulse rounded-lg border p-6">Cargando...</div>}
      {err && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{err}</div>
      )}

      {!loading && !err && (
        <>
          {/* Tabla */}
          {empty ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
              No hay productos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Imagen</Th>
                    <Th>Nombre</Th>
                    <Th>Categoría</Th>
                    <Th>Precio</Th>
                    <Th>Stock</Th>
                    <Th>Estado</Th>
                    <Th className="text-right">Acciones</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60">
                      <td className="p-2">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded bg-gray-100">
                            {p.imagenUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.imagenUrl}
                                alt={p.nombre}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                —
                              </div>
                            )}
                          </div>
                          <label className="text-xs text-primary underline cursor-pointer">
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) onCambiarImagen(p, f);
                              }}
                            />
                            Cambiar
                          </label>
                        </div>
                      </td>

                      <Td className="font-medium">{p.nombre}</Td>
                      <Td>
                        {p.categoria}
                        {p.subcategoria ? ` / ${p.subcategoria}` : ''}
                      </Td>
                      <Td>{currencyCOP(p.precio)}</Td>
                      <Td>
                        <span
                          className={`rounded-full px-2 py-0.5 text-sm ${
                            Number(p.stock) <= Number(p.stockMinimo ?? 0)
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </Td>
                      <Td>
                        <span className={badgeForEstado(p.estado)}>{p.estado ?? '—'}</span>
                      </Td>

                      <td className="p-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => abrirEditar(p)}
                            className="rounded border px-2 py-1 text-sm hover:bg-gray-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => onEliminar(p.id)}
                            className="rounded border border-red-300 bg-red-50 px-2 py-1 text-sm text-red-700 hover:bg-red-100"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Crear (abajo de la tabla) */}
          {createOpen && (
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Crear producto</h2>
              <form onSubmit={onCrear} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Nombre">
                  <input
                    className="input"
                    value={nuevo.nombre}
                    onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Marca">
                  <input
                    className="input"
                    value={nuevo.marca}
                    onChange={(e) => setNuevo({ ...nuevo, marca: e.target.value })}
                  />
                </Field>

                <Field label="Categoría">
                  <input
                    className="input"
                    value={nuevo.categoria}
                    onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Subcategoría">
                  <input
                    className="input"
                    value={nuevo.subcategoria}
                    onChange={(e) => setNuevo({ ...nuevo, subcategoria: e.target.value })}
                  />
                </Field>

                <Field label="Precio (COP)">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    step="1"
                    value={nuevo.precio}
                    onChange={(e) => setNuevo({ ...nuevo, precio: Number(e.target.value) })}
                    required
                  />
                </Field>
                <Field label="Stock">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    step="1"
                    value={nuevo.stock}
                    onChange={(e) => setNuevo({ ...nuevo, stock: Number(e.target.value) })}
                    required
                  />
                </Field>

                <Field label="Stock mínimo">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    step="1"
                    value={nuevo.stockMinimo}
                    onChange={(e) => setNuevo({ ...nuevo, stockMinimo: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Estado">
                  <select
                    className="input"
                    value={nuevo.estado}
                    onChange={(e) => setNuevo({ ...nuevo, estado: e.target.value as Estado })}
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                    <option value="AGOTADO">AGOTADO</option>
                  </select>
                </Field>

                <Field label="Descripción" className="md:col-span-2">
                  <textarea
                    className="input"
                    rows={3}
                    value={nuevo.descripcion}
                    onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
                    required
                  />
                </Field>

                {/* Archivo en creación */}
                <Field label="Imagen (opcional)" className="md:col-span-2">
                  <input
                    className="block w-full text-sm"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setNuevoArchivo(e.target.files?.[0] ?? null)}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Formatos: JPG, PNG, WEBP. Máx 5MB.
                  </p>
                </Field>

                <div className="col-span-full mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="rounded border px-3 py-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={cargandoCrear}
                    className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-60"
                  >
                    {cargandoCrear ? 'Creando...' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Editar (panel simple) */}
          {editId && editData && (
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Editar producto</h2>
                <button
                  onClick={() => {
                    setEditId(null);
                    setEditData(null);
                  }}
                  className="rounded border px-2 py-1"
                >
                  Cerrar
                </button>
              </div>

              <form onSubmit={onGuardarEdit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Nombre">
                  <input
                    className="input"
                    value={editData.nombre}
                    onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Marca">
                  <input
                    className="input"
                    value={editData.marca}
                    onChange={(e) => setEditData({ ...editData, marca: e.target.value })}
                  />
                </Field>

                <Field label="Categoría">
                  <input
                    className="input"
                    value={editData.categoria}
                    onChange={(e) => setEditData({ ...editData, categoria: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Subcategoría">
                  <input
                    className="input"
                    value={editData.subcategoria}
                    onChange={(e) => setEditData({ ...editData, subcategoria: e.target.value })}
                  />
                </Field>

                <Field label="Precio (COP)">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    step={1}
                    value={editData.precio}
                    onChange={(e) => setEditData({ ...editData, precio: Number(e.target.value) })}
                    required
                  />
                </Field>
                <Field label="Stock">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    step={1}
                    value={editData.stock}
                    onChange={(e) => setEditData({ ...editData, stock: Number(e.target.value) })}
                    required
                  />
                </Field>

                <Field label="Stock mínimo">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    step={1}
                    value={editData.stockMinimo}
                    onChange={(e) =>
                      setEditData({ ...editData, stockMinimo: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Estado">
                  <select
                    className="input"
                    value={editData.estado}
                    onChange={(e) => setEditData({ ...editData, estado: e.target.value as Estado })}
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                    <option value="AGOTADO">AGOTADO</option>
                  </select>
                </Field>

                <Field label="Descripción" className="md:col-span-2">
                  <textarea
                    className="input"
                    rows={3}
                    value={editData.descripcion}
                    onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                    required
                  />
                </Field>

                {/* Reemplazo de imagen en editar */}
                <Field label="Imagen (reemplazar)" className="md:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded bg-gray-100">
                      {editData.imagenUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editData.imagenUrl} alt="img" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          —
                        </div>
                      )}
                    </div>
                    <label className="text-sm text-primary underline cursor-pointer">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          try {
                            const form = new FormData();
                            form.append('file', f);
                            const { data } = await api.post<{ imagenUrl: string }>(
                              `/productos/${editId}/imagen`,
                              form,
                              { headers: { 'Content-Type': 'multipart/form-data' } }
                            );
                            setEditData({ ...editData, imagenUrl: data.imagenUrl });
                            setItems((arr) =>
                              arr.map((x) =>
                                x.id === editId ? { ...x, imagenUrl: data.imagenUrl } : x
                              )
                            );
                          } catch (e: any) {
                            alert(e?.response?.data?.message || 'Error subiendo imagen');
                          }
                        }}
                      />
                      Subir nueva imagen
                    </label>
                  </div>
                </Field>

                <div className="col-span-full mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(null);
                      setEditData(null);
                    }}
                    className="rounded border px-3 py-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoEdit}
                    className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-60"
                  >
                    {guardandoEdit ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ------- Helpers UI -------
function Th({
  children,
  className = '',
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th className={`p-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`p-2 align-middle text-sm ${className}`}>{children}</td>;
}

function badgeForEstado(estado?: Estado) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  switch (estado) {
    case 'ACTIVO':
      return `${base} bg-emerald-100 text-emerald-700`;
    case 'INACTIVO':
      return `${base} bg-gray-200 text-gray-700`;
    case 'AGOTADO':
      return `${base} bg-amber-100 text-amber-800`;
    default:
      return `${base} bg-gray-100 text-gray-600`;
  }
}

function Field({
  label,
  className = '',
  children,
}: React.PropsWithChildren<{ label: string; className?: string }>) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm text-gray-700">{label}</span>
      {children}
    </label>
  );
}
