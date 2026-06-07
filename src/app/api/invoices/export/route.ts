import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sortField = searchParams.get('sort') || 'fechaEmision';
  const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';
  const filterEstado = searchParams.get('estado') || '';
  const searchQuery = searchParams.get('q') || '';
  const desde = searchParams.get('desde') || '';
  const hasta = searchParams.get('hasta') || '';

  let orderBy: any = { fechaEmision: sortDir };
  if (sortField === 'correlativo') orderBy = { correlativo: sortDir };
  else if (sortField === 'montoTotal') orderBy = { montoTotal: sortDir };
  else if (sortField === 'fechaEmision') orderBy = { fechaEmision: sortDir };
  else if (sortField === 'fechaVencimiento') orderBy = { fechaVencimiento: sortDir };
  else if (sortField === 'estado') orderBy = { estado: sortDir };
  else if (sortField === 'client') orderBy = { client: { razonSocial: sortDir } };

  const where: any = {};
  if (filterEstado) where.estado = filterEstado;
  if (searchQuery) {
    where.OR = [
      { client: { razonSocial: { contains: searchQuery, mode: 'insensitive' } } },
      { client: { rut: { contains: searchQuery, mode: 'insensitive' } } },
    ];
  }
  if (desde) {
    where.fechaEmision = { ...where.fechaEmision, gte: new Date(desde) };
  }
  if (hasta) {
    const hastaEnd = new Date(hasta);
    hastaEnd.setHours(23, 59, 59, 999);
    where.fechaEmision = { ...where.fechaEmision, lte: hastaEnd };
  }

  const invoices = await prisma.invoice.findMany({
    orderBy,
    where,
    include: { client: true },
  });

  // Build CSV
  const headers = ['Nº', 'Cliente', 'RUT', 'Fecha Emisión', 'Fecha Vencimiento', 'Neto', 'IVA', 'Total', 'Estado'];
  const rows = invoices.map((inv) => [
    String(inv.correlativo),
    inv.client.razonSocial,
    inv.client.rut,
    inv.fechaEmision.toISOString().split('T')[0],
    inv.fechaVencimiento.toISOString().split('T')[0],
    inv.montoNeto.toLocaleString('es-CL'),
    inv.montoIva.toLocaleString('es-CL'),
    inv.montoTotal.toLocaleString('es-CL'),
    inv.estado,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  // Build filename from filters
  const nameParts = ['facturas'];
  if (filterEstado) nameParts.push(filterEstado.toLowerCase().normalize('NFD').replace(/[^\w-]/g, ''));
  if (searchQuery) nameParts.push('busqueda');
  nameParts.push(new Date().toISOString().split('T')[0]);
  const filename = nameParts.join('-');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  });
}
