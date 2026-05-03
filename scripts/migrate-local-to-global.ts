import { PrismaClient } from '@prisma/client';

async function migrate() {
  const localUrl = 'postgresql://root:rootpassword@localhost:5432/cotizador?schema=public';
  const globalUrl = process.env.DATABASE_URL;
  const currentAdminId = 'e5968ca3-a934-4302-ab60-3a5f9260cbf4';

  if (!globalUrl) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  const localPrisma = new PrismaClient({
    datasources: { db: { url: localUrl } },
  });

  const globalPrisma = new PrismaClient({
    datasources: { db: { url: globalUrl } },
  });

  console.log('🚀 Starting Data Migration (Local to Global) with ID Mapping...');

  try {
    // 1. Clients
    console.log('👥 Migrating Clients...');
    const clients = await localPrisma.client.findMany();
    for (const client of clients) {
      await globalPrisma.client.upsert({
        where: { id: client.id },
        update: client,
        create: client,
      });
    }
    console.log(`✅ Migrated ${clients.length} clients`);

    // 2. Products
    console.log('📦 Migrating Products...');
    const products = await localPrisma.product.findMany();
    for (const product of products) {
      await globalPrisma.product.upsert({
        where: { id: product.id },
        update: product,
        create: product,
      });
    }
    console.log(`✅ Migrated ${products.length} products`);

    // 3. Quotes
    console.log('📄 Migrating Quotes...');
    const quotes = await localPrisma.quote.findMany();
    for (const quote of quotes) {
      await globalPrisma.quote.upsert({
        where: { id: quote.id },
        update: quote,
        create: quote,
      });
    }
    console.log(`✅ Migrated ${quotes.length} quotes`);

    // 4. Quote Items
    console.log('📑 Migrating Quote Items...');
    const quoteItems = await localPrisma.quoteItem.findMany();
    for (const item of quoteItems) {
      await globalPrisma.quoteItem.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✅ Migrated ${quoteItems.length} quote items`);

    // 5. VPS Services
    console.log('🖥️ Migrating VPS Services...');
    const servers = await localPrisma.vpsService.findMany();
    for (const server of servers) {
      await globalPrisma.vpsService.upsert({
        where: { id: server.id },
        update: server,
        create: server,
      });
    }
    console.log(`✅ Migrated ${servers.length} servers`);

    // 6. Tickets (Mapping UserId)
    console.log('🎫 Migrating Tickets...');
    const tickets = await localPrisma.ticket.findMany();
    for (const ticket of tickets) {
      // Create a copy without the old userId if we want to remap it
      const { userId, ...ticketData } = ticket;
      await globalPrisma.ticket.upsert({
        where: { id: ticket.id },
        update: { ...ticketData, userId: currentAdminId },
        create: { ...ticketData, userId: currentAdminId },
      });
    }
    console.log(`✅ Migrated ${tickets.length} tickets`);

    // 7. Ticket Messages (Mapping UserId)
    console.log('💬 Migrating Ticket Messages...');
    const messages = await localPrisma.ticketMessage.findMany();
    for (const msg of messages) {
      const { userId, ...msgData } = msg;
      await globalPrisma.ticketMessage.upsert({
        where: { id: msg.id },
        update: { ...msgData, userId: currentAdminId },
        create: { ...msgData, userId: currentAdminId },
      });
    }
    console.log(`✅ Migrated ${messages.length} messages`);

    console.log('🏁 Migration finished successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await localPrisma.$disconnect();
    await globalPrisma.$disconnect();
  }
}

migrate();
