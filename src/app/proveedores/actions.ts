'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
export async function guardarProveedor(fd: FormData) {
  const data = {
    nombre: String(fd.get('nombre') || '').trim(),
    ruc: String(fd.get('ruc') || '') || null,
    telefono: String(fd.get('telefono') || '') || null,
    contacto: String(fd.get('contacto') || '') || null,
    direccion: String(fd.get('direccion') || '') || null,
  };
  if (!data.nombre) throw new Error('El nombre es obligatorio.');
  await prisma.proveedor.create({ data });
  revalidatePath('/proveedores');
}
