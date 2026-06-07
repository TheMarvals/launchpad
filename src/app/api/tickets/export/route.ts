import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sortField = searchParams.get('sort') || 'updatedAt';
  const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';
  const filterEstado = searchParams.get('estado') || '';
  const filterPrioridad = searchParams.get('prioridad') || '';
  const searchQuery = searchParams.get('q') || '';
  const desde = searchParams.get('desde') || '';
  const hasta = searchParams.get('hasta') || '';

  let orderBy: any = { updatedAt: sortDir };
  if (sortField === 'subject') orderBy = { subject: sortDir };
  else if (sortField === 'status') orderBy = { status: sortDir };
  else if (sortField === 'priority') orderBy = { priority: sortDir };
  else if (sortField === 'updatedAt') orderBy = { updatedAt: sortDir };
  else if (sortField === 'client') orderBy = { client: { razonSocial: sortDir } };

  const where: any = {};
  if (filterEstado) where.status = filterEstado;
  if (filterPrioridad) where.priority = filterPrioridad;
  if (searchQuery) {
    where.OR = [
      { client: { razonSocial: { contains: searchQuery, mode: 'insensitive' } } },
      { subject: { contains: searchQuery, mode: 'insensitive' } },
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

  const tickets = await prisma.ticket.findMany({
    orderBy,
    where,
    include: {
      client: {
        select: { razonSocial: true, rut: true },
      },
      _count: {
        select: { messages: true },
      },
    },
  });

  // Build CSV
  const headers = ['ID', 'Cliente', 'RUT Cliente', 'Asunto', 'Prioridad', 'Estado', 'Mensajes', 'Creado', 'Actualizado'];
  const rows = tickets.map((t) => [
    t.id.split('-')[0].toUpperCase(),
    t.client.razonSocial,
    t.client.rut,
    t.subject,
    t.priority,
    t.status,
    String(t._count.messages),
    t.createdAt.toISOString().split('T')[0],
    t.updatedAt.toISOString().split('T')[0],
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  // Build filename from filters
  const nameParts = ['tickets'];
  if (filterEstado) nameParts.push(filterEstado.toLowerCase());
  if (filterPrioridad) nameParts.push(filterPrioridad.toLowerCase());
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
