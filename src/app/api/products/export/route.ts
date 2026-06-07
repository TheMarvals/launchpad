import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { nombre: 'asc' },
  });

  // Build CSV
  const headers = ['Código', 'Nombre', 'Descripción', 'Precio Neto', 'Exento IVA'];
  const rows = products.map((p) => [
    p.codigo || '',
    p.nombre,
    p.descripcion || '',
    p.precioNeto.toLocaleString('es-CL'),
    p.esExento ? 'Sí' : 'No',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="productos-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
