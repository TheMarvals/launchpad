import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filterAccion = searchParams.get('accion') || '';
  const filterEstado = searchParams.get('estado') || '';
  const filterUsuario = searchParams.get('usuario') || '';
  const desde = searchParams.get('desde') || '';
  const hasta = searchParams.get('hasta') || '';

  const where: any = {};
  if (filterAccion) where.action = filterAccion;
  if (filterEstado) where.status = filterEstado;
  if (filterUsuario) where.userId = filterUsuario;
  if (desde) {
    where.createdAt = { ...where.createdAt, gte: new Date(desde) };
  }
  if (hasta) {
    const hastaEnd = new Date(hasta);
    hastaEnd.setHours(23, 59, 59, 999);
    where.createdAt = { ...where.createdAt, lte: hastaEnd };
  }

  const logs = await prisma.actionLog.findMany({
    orderBy: { createdAt: 'desc' },
    where,
    include: {
      user: {
        select: { name: true, email: true },
      },
      server: {
        select: { name: true, ipAddress: true, providerId: true },
      },
    },
  });

  // Build filename from filters
  const parts = ['audit-logs'];
  if (filterEstado) parts.push(filterEstado.toLowerCase());
  if (filterAccion) parts.push(filterAccion.toLowerCase());
  if (filterUsuario) parts.push('usuario-filtrado');
  parts.push(new Date().toISOString().split('T')[0]);
  const filename = parts.join('-');

  // Build CSV
  const headers = ['Fecha', 'Usuario', 'Email', 'Servidor', 'IP/Provider', 'Acción', 'Estado', 'Detalles'];
  const rows = logs.map((log) => [
    log.createdAt.toISOString().replace('T', ' ').split('.')[0],
    log.user.name,
    log.user.email,
    log.server.name,
    log.server.ipAddress || log.server.providerId || '',
    log.action,
    log.status,
    log.details || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  });
}
