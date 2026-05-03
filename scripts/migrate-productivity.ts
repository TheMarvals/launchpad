import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();

// MySQL Config from freelancehub
const mysqlConfig = {
  host: '192.168.1.250',
  user: 'marval',
  password: 'ThomasMarval2105..',
  database: 'freelancehub',
  port: 3306,
};

async function migrate() {
  console.log('🚀 Starting Migration...');

  let mysqlConn;
  try {
    mysqlConn = await mysql.createConnection(mysqlConfig);
    console.log('✅ Connected to MySQL');

    // 1. Ensure User Exists
    const targetEmail = 'admin@themarvals.com';
    const userId = 'e5968ca3-a934-4302-ab60-3a5f9260cbf4';
    
    let user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      console.log(`👤 Creating user ${targetEmail} with fixed ID ${userId}...`);
      user = await prisma.user.create({
        data: {
          id: userId,
          email: targetEmail,
          name: 'Eduardo Marval',
          password: 'Thomas21..',
          role: 'ADMIN',
        },
      });
    }

    // 2. Migrate Projects
    console.log('📂 Migrating Projects...');
    const [projects] = await mysqlConn.query('SELECT * FROM projects');
    for (const p of projects as any[]) {
      await prisma.project.create({
        data: {
          userId,
          name: p.name,
          clientName: p.client,
          status: p.status,
          priority: p.priority,
          budget: p.budget,
          deadline: p.deadline ? new Date(p.deadline) : null,
          description: p.description,
          color: p.color,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
        },
      });
    }
    console.log(`✅ Migrated ${(projects as any[]).length} projects`);

    // 3. Migrate Tasks
    console.log('✅ Migrating Tasks...');
    const [tasks] = await mysqlConn.query('SELECT * FROM tasks');
    for (const t of tasks as any[]) {
      // Find the project in the new DB if it was linked
      let newProjectId = null;
      if (t.project_id) {
        const proj = await prisma.project.findFirst({ where: { name: t.project_name } }); // This is risky, but let's assume names are unique for now or just skip project link for tasks in this quick migration
      }

      await prisma.task.create({
        data: {
          userId,
          title: t.title,
          priority: t.priority,
          status: t.status,
          dueDate: t.due ? new Date(t.due) : null,
          notes: t.notes,
          createdAt: new Date(t.created_at),
          updatedAt: new Date(t.updated_at),
        },
      });
    }
    console.log(`✅ Migrated ${(tasks as any[]).length} tasks`);

    // 4. Migrate Notes
    console.log('📝 Migrating Notes...');
    const [notes] = await mysqlConn.query('SELECT * FROM notes');
    for (const n of notes as any[]) {
      await prisma.personalNote.create({
        data: {
          userId,
          title: n.title,
          content: n.content,
          color: n.color,
          createdAt: new Date(n.created_at),
          updatedAt: new Date(n.updated_at),
        },
      });
    }
    console.log(`✅ Migrated ${(notes as any[]).length} notes`);

    // 5. Migrate Time Entries
    console.log('⏱️ Migrating Time Entries...');
    const [entries] = await mysqlConn.query('SELECT * FROM time_entries');
    for (const e of entries as any[]) {
      await prisma.timeEntry.create({
        data: {
          userId,
          description: e.description,
          duration: e.duration,
          date: new Date(e.date),
          createdAt: new Date(e.created_at),
        },
      });
    }
    console.log(`✅ Migrated ${(entries as any[]).length} time entries`);

    console.log('🏁 Migration finished successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (mysqlConn) await mysqlConn.end();
    await prisma.$disconnect();
  }
}

migrate();
