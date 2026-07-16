'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function guardarProducto(formData: FormData) {
  const id = formData.get('id') ? Number(formData.get('id')) : null;
  const data = {
    nombre: String(formData.get('nombre') || '').trim(),
    principioActivo: String(formData.get('principioActivo') || '').trim(),
    concentracion: String(formData.get('concentracion') || '') || null,
    formaFarma: String(formData.get('formaFarma') || '') || null,
    codigoBarras: String(formData.get('codigoBarras') || '') || null,
    requiereReceta: formData.get('requiereReceta') === 'on',
    precioCaja: Number(formData.get('precioCaja') || 0),
    precioBlister: Number(formData.get('precioBlister') || 0),
    precioUnidad: Number(formData.get('precioUnidad') || 0),
    unidadesPorCaja: Number(formData.get('unidadesPorCaja') || 1),
    unidadesPorBlister: Number(formData.get('unidadesPorBlister') || 1),
    stockMinimo: Number(formData.get('stockMinimo') || 10),
  };
  if (!data.nombre || !data.principioActivo) throw new Error('Nombre y principio activo son obligatorios.');
  if (id) await prisma.producto.update({ where: { id }, data });
  else await prisma.producto.create({ data });
  revalidatePath('/productos');
}

export async function listarProductos(q?: string) {
  return prisma.producto.findMany({
    where: q ? { OR: [{ nombre: { contains: q } }, { principioActivo: { contains: q } }, { codigoBarras: { contains: q } }] } : {},
    include: { laboratorio: true, categoria: true, lotes: true },
    orderBy: { nombre: 'asc' }, take: 200,
  });
}
