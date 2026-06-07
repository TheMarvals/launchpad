import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { razonSocial: 'asc' },
    include: {
      _count: { select: { quotes: true } },
    },
  });

  // Build CSV
  const headers = ['RUT', 'Razón Social', 'Giro', 'Dirección', 'Comuna', 'Ciudad', 'Email', 'Teléfono', 'Cotizaciones'];
  const rows = clients.map((c) => [
    c.rut,
    c.razonSocial,
    c.giro,
    c.direccion,
    c.comuna,
    c.ciudad,
    c.email || '',
    c.telefono || '',
    String(c._count.quotes),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clientes-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
