import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrating ShowcaseProject descriptions...\n');

  const projects = await prisma.showcaseProject.findMany({
    where: {
      description: { not: null },
      descriptionEs: null,
    },
    select: { id: true, title: true, description: true },
  });

  if (projects.length === 0) {
    console.log('✅ No projects to migrate — all existing descriptions already have descriptionEs.');
    return;
  }

  console.log(`Found ${projects.length} project(s) with legacy description but no descriptionEs.\n`);

  let success = 0;
  for (const project of projects) {
    await prisma.showcaseProject.update({
      where: { id: project.id },
      data: { descriptionEs: project.description },
    });
    const preview = (project.description ?? '').substring(0, 60).replace(/\n/g, ' ');
    console.log(`  ✅ "${project.title}" → descriptionEs: "${preview}${(project.description?.length ?? 0) > 60 ? '...' : ''}"`);
    success++;
  }

  console.log(`\n📊 Migration complete: ${success}/${projects.length} project(s) updated.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
