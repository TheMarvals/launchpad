import { sendNewTicketNotificationToAdmin, sendTicketReplyNotificationToClient } from './src/lib/email';
import * as dotenv from 'dotenv';
dotenv.config();

async function testEmails() {
  console.log("Iniciando test de correos...");
  try {
    await sendNewTicketNotificationToAdmin({
      ticketId: 'TEST-123456',
      subject: 'Problema de prueba (Ignorar)',
      priority: 'HIGH',
      message: 'Este es un mensaje de prueba desde la consola para validar el envio.',
      clientName: 'Cliente Test',
      clientEmail: 'test@example.com',
      senderName: 'Usuario Test',
      senderRole: 'CLIENT'
    });
    console.log("Test admin completado.");
    
    await sendTicketReplyNotificationToClient({
      ticketId: 'TEST-123456',
      subject: 'Re: Problema de prueba (Ignorar)',
      priority: 'HIGH',
      message: 'Mensaje original',
      clientName: 'Cliente Test',
      clientEmail: process.env.USERM || 'test@example.com', // Enviamos a nosotros mismos para probar
      senderName: 'Soporte MARVAL',
      senderRole: 'ADMIN',
      replyMessage: 'Esta es una respuesta de prueba.'
    });
    console.log("Test cliente completado.");
  } catch (error) {
    console.error("Test Fallo:", error);
  }
}

testEmails();
