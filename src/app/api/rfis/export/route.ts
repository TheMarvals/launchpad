import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sortField = searchParams.get('sort') || 'createdAt';
  const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';
  const filterEstado = searchParams.get('estado') || '';
  const searchQuery = searchParams.get('q') || '';
  const desde = searchParams.get('desde') || '';
  const hasta = searchParams.get('hasta') || '';

  let orderBy: any = { createdAt: sortDir };
  if (sortField === 'correlativo') orderBy = { correlativo: sortDir };
  else if (sortField === 'fechaEmision') orderBy = { fechaEmision: sortDir };
  else if (sortField === 'fechaValidez') orderBy = { fechaValidez: sortDir };
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

  const rfis = await prisma.rfi.findMany({
    orderBy,
    where,
    include: { client: true },
  });

  // Build CSV
  const headers = ['Nº', 'Cliente', 'RUT', 'Fecha Emisión', 'Fecha Límite', 'Estado'];
  const rows = rfis.map((q) => [
    String(q.correlativo),
    q.client.razonSocial,
    q.client.rut,
    q.fechaEmision.toISOString().split('T')[0],
    q.fechaValidez.toISOString().split('T')[0],
    q.estado,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const nameParts = ['rfis'];
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
