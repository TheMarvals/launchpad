import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a default client
  const client = await prisma.client.upsert({
    where: { rut: '76.543.210-K' },
    update: {},
    create: {
      rut: '76.543.210-K',
      razonSocial: 'EMPRESA DE TECNOLOGÍA SPA',
      giro: 'SERVICIOS INFORMÁTICOS',
      direccion: 'AV. PROVIDENCIA 1234, SANTIAGO',
      comuna: 'PROVIDENCIA',
      ciudad: 'SANTIAGO',
      email: 'contacto@empresa-ejemplo.cl',
      telefono: '+569 8888 7777'
    },
  });

  console.log({ client });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
