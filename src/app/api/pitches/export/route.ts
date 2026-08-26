import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sortField = searchParams.get('sort') || 'createdAt';
  const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';
  const filterStatus = searchParams.get('status') || '';
  const searchQuery = searchParams.get('q') || '';
  const desde = searchParams.get('desde') || '';
  const hasta = searchParams.get('hasta') || '';

  let orderBy: any = { createdAt: sortDir };
  if (sortField === 'correlativo') orderBy = { correlativo: sortDir };
  else if (sortField === 'title') orderBy = { title: sortDir };
  else if (sortField === 'status') orderBy = { status: sortDir };
  else if (sortField === 'createdAt') orderBy = { createdAt: sortDir };

  const where: any = {};
  if (filterStatus) where.status = filterStatus;
  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { clientName: { contains: searchQuery, mode: 'insensitive' } },
      { client: { razonSocial: { contains: searchQuery, mode: 'insensitive' } } },
    ];
  }
  if (desde) {
    where.createdAt = { ...where.createdAt, gte: new Date(desde) };
  }
  if (hasta) {
    const hastaEnd = new Date(hasta);
    hastaEnd.setHours(23, 59, 59, 999);
    where.createdAt = { ...where.createdAt, lte: hastaEnd };
  }

  const pitches = await prisma.pitch.findMany({
    orderBy,
    where,
    include: { client: true },
  });

  const headers = ['Nº', 'Título', 'Cliente', 'Estado', 'Fecha Creación'];
  const rows = pitches.map((p) => [
    String(p.correlativo),
    p.title,
    p.client?.razonSocial || p.clientName || '---',
    p.status,
    p.createdAt.toISOString().split('T')[0],
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const nameParts = ['pitches'];
  if (filterStatus) nameParts.push(filterStatus.toLowerCase().normalize('NFD').replace(/[^\w-]/g, ''));
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
