'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendSecurityOtpEmail } from '@/lib/email';
import { generateAndSaveOtp, verifyAndConsumeOtp } from '@/lib/otp';

const API_BASE = process.env.PROVIDER_API_BASE;

export async function getVncUrl(serverId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  const clientId = (session?.user as any)?.clientId;

  if (!userId || !clientId) {
    return { error: 'No autorizado' };
  }

  const server = await prisma.vpsService.findFirst({
    where: { id: serverId, clientId }
  });

  if (!server || !server.providerId) {
    return { error: 'Servidor no encontrado o sin ID de proveedor.' };
  }

  const token = process.env.PROVIDER_API_TOKEN;
  if (!token) {
    return { error: 'API Token del proveedor no configurado.' };
  }

  try {
    const [vncRes, serverRes] = await Promise.all([
      fetch(`${API_BASE}/servers/${server.providerId}/vnc_up`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      }),
      fetch(`${API_BASE}/servers/${server.providerId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      })
    ]);

    if (!vncRes.ok) {
      return { error: 'No se pudo generar la consola. El servidor podría estar apagado o en mantenimiento.' };
    }

    const vncRaw = await vncRes.json();
    const vncData = vncRaw.data || vncRaw;

    // Get VNC password from server settings
    let vncPassword = '';
    if (serverRes.ok) {
      const serverRaw = await serverRes.json();
      const serverData = serverRaw.data || serverRaw;
      vncPassword = serverData.settings?.vnc_password || '';
    }

    // The provider returns:
    //   vnc_proxy_url: "https://panel.servercheap.com/vnc?url="  (WebSocket proxy, https scheme)
    //   url: "TOKEN..."  (encrypted session token)
    //
    // The actual WebSocket URL is: wss://panel.servercheap.com:443/vnc?url=TOKEN

    if (!vncData.vnc_proxy_url || !vncData.url) {
      return { error: 'El proveedor no devolvió una URL válida para la consola.' };
    }

    // Convert https:// to wss:// for WebSocket connection
    const wsUrl = vncData.vnc_proxy_url
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
    const finalWsUrl = `${wsUrl}${vncData.url}`;

    return { success: true, url: finalWsUrl, vncPassword };
  } catch (e) {
    return { error: 'Error de conexión con el proveedor.' };
    export async function requestServerAction(serverId: string, action: 'start' | 'stop' | 'restart') {
      const session = await auth();
      const userId = session?.user?.id;
      const clientId = (session?.user as any)?.clientId;

      if (!userId || !clientId) {
        return { error: 'No autorizado' };
      }

      const server = await prisma.vpsService.findFirst({
        where: { id: serverId, clientId },
        include: { client: true }
      });

      if (!server) {
        return { error: 'Servidor no encontrado o acceso denegado.' };
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.email) {
        return { error: 'Usuario inválido o sin correo.' };
      }

      // Generate new OTP and invalidate old ones via helper
      const code = await generateAndSaveOtp(userId, action, serverId);

      // Send unified email
      const actionText = action === 'start' ? 'Iniciar' : action === 'stop' ? 'Detener' : 'Reiniciar';
      await sendSecurityOtpEmail(
        user.email,
        code,
        user.name || 'Usuario',
        "Autorización de Acción Crítica",
        `Has solicitado <strong style="color:#ffffff;">${actionText}</strong> el servidor <strong style="color:#ffffff;">${server.name}</strong>. Para proceder de forma segura, ingresa el siguiente código de autorización temporal en el portal:`
      );

      return { success: true, message: 'Código enviado a tu correo' };
    }

    export async function executeServerActionWithOtp(serverId: string, action: 'start' | 'stop' | 'restart', code: string) {
      const session = await auth();
      const userId = session?.user?.id;
      const clientId = (session?.user as any)?.clientId;

      if (!userId || !clientId) {
        return { error: 'No autorizado' };
      }

      const server = await prisma.vpsService.findFirst({
        where: { id: serverId, clientId }
      });

      if (!server) {
        return { error: 'Servidor no encontrado o acceso denegado.' };
      }

      // Validate OTP via helper
      const verification = await verifyAndConsumeOtp(userId, action, code, serverId);

      if (!verification.isValid) {
        return { error: verification.error };
      }

      const token = process.env.PROVIDER_API_TOKEN;
      if (!token) {
        await logAction(userId, serverId, action, 'FAILED', 'API Token no configurado');
        return { error: 'API Token del proveedor no configurado.' };
      }

      try {
        const body = (action === 'stop' || action === 'restart') ? JSON.stringify({ force: false }) : undefined;

        const res = await fetch(`${API_BASE}/servers/${server.providerId}/${action}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body
        });

        if (!res.ok) {
          const text = await res.text();
          console.error(`Provider API Error (${action}):`, text);
          // Log failure
          await logAction(userId, serverId, action, 'FAILED', `Error API: ${res.status}`);

          // Ya no simularemos el éxito. Si el API del proveedor falla, devolvemos el error real al frontend.
          return { error: `El proveedor Cloud rechazó la orden (Código: ${res.status}). Revisa que el ID del servidor y el API Token sean correctos.` };
        }

        // Si res.ok es true, significa que el proveedor aceptó la orden y la está ejecutando en sus servidores físicos.

        // Log success
        await logAction(userId, serverId, action, 'SUCCESS', 'Ejecutado con éxito en el proveedor cloud');

        if (action === 'stop') {
          await prisma.vpsService.update({ where: { id: serverId }, data: { status: 'offline' } });
        } else if (action === 'start') {
          await prisma.vpsService.update({ where: { id: serverId }, data: { status: 'active' } });
        }

        revalidatePath('/client-portal/servers');
        revalidatePath('/client-portal');

        return { success: true };
      } catch (e: any) {
        console.error("Fetch error:", e);
        await logAction(userId, serverId, action, 'FAILED', 'Error de red');
        return { error: 'Error de red al conectar con el proveedor cloud.' };
      }
    }

    async function logAction(userId: string, serverId: string, action: string, status: string, details: string) {
      await prisma.actionLog.create({
        data: {
          userId,
          serverId,
          action,
          status,
          details
        }
      });
    }

    export async function getServerLiveMetrics(serverId: string) {
      const session = await auth();
      const userId = session?.user?.id;
      const clientId = (session?.user as any)?.clientId;

      if (!userId || !clientId) {
        return { error: 'No autorizado' };
      }

      const server = await prisma.vpsService.findFirst({
        where: { id: serverId, clientId }
      });

      if (!server || !server.providerId) {
        return { error: 'Servidor no encontrado o sin ID de proveedor.' };
      }

      const token = process.env.PROVIDER_API_TOKEN;
      if (!token) {
        return { error: 'API Token del proveedor no configurado.' };
      }

      try {
        const res = await fetch(`${API_BASE}/servers/${server.providerId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          next: { revalidate: 30 } // Cache results for 30s to prevent spamming the provider
        });

        if (!res.ok) {
          return { error: 'No se pudieron obtener las métricas del servidor.' };
        }

        const raw = await res.json();
        const data = raw.data || raw;

        if (!data) return { error: 'Formato de respuesta inválido.' };

        const usage = data.usage || {};
        const cpuUsage = data.cpu_usage || usage.cpu || 0;
        const diskBytes = usage.disk?.actual_size || 0;
        const networkIncomingBytes = usage.network?.incoming?.value || usage.network?.incoming || 0;
        const networkOutgoingBytes = usage.network?.outgoing?.value || usage.network?.outgoing || 0;

        // Traffic limit calculation
        const planLimit = data.plan?.limits?.network_total_traffic?.limit;
        const planUnit = data.plan?.limits?.network_total_traffic?.unit;

        let limitBytes = 8 * 1024 * 1024 * 1024 * 1024; // fallback 8 TiB in bytes
        if (planLimit && planUnit === 'TiB') {
          limitBytes = planLimit * 1024 * 1024 * 1024 * 1024;
        } else if (planLimit && planUnit === 'GiB') {
          limitBytes = planLimit * 1024 * 1024 * 1024;
        } else if (planLimit && planLimit > 0) {
          limitBytes = planLimit; // assume bytes if unit missing
        }

        // Fetch allocated hardware specs from the API
        const allocatedCpu = data.specifications?.vcpu || null;

        // RAM comes in bytes, convert to MiB
        const ramBytes = data.specifications?.ram;
        const allocatedRam = ramBytes ? Math.round(ramBytes / (1024 * 1024)) : null;

        // Disk comes in GiB
        const allocatedDisk = data.specifications?.disk || null;

        return {
          success: true,
          data: {
            cpuUsage,
            diskBytes,
            networkIncomingBytes,
            networkOutgoingBytes,
            networkLimitBytes: limitBytes,
            allocatedCpu,
            allocatedRam,
            allocatedDisk
          }
        };
      } catch (e) {
        console.error("Error fetching live metrics:", e);
        return { error: 'Error de red al consultar el proveedor.' };
      }
    }
