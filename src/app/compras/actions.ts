'use server';
import { prisma } from '@/lib/prisma';
import { registrarCompra, type LineaCompra } from '@/lib/inventory';
import { revalidatePath } from 'next/cache';

export async function crearCompra(
  proveedorId: number, numeroDoc: string, lineas: LineaCompra[]
) {
  if (!proveedorId) throw new Error('Selecciona un proveedor.');
  if (!lineas.length) throw new Error('Agrega al menos un producto.');
  const compra = await registrarCompra(proveedorId, numeroDoc || undefined, lineas);
  revalidatePath('/compras'); revalidatePath('/inventario'); revalidatePath('/');
  return { id: compra.id, total: compra.total };
}

export async function datosCompra() {
  const [proveedores, productos] = await Promise.all([
    prisma.proveedor.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } }),
    prisma.producto.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' }, select: { id: true, nombre: true, principioActivo: true } }),
  ]);
  return { proveedores, productos };
}
