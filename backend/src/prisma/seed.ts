import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const existingAdmin = await prisma.admin.findUnique({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.admin.create({
      data: {
        username: 'admin',
        passwordHash,
      },
    });
    console.log('Created admin user:', admin.username);
  } else {
    console.log('Admin user already exists');
  }

  const groups = ['Разработка', 'Дизайн', 'Менеджмент', 'QA'];

  for (const groupName of groups) {
    const existingGroup = await prisma.group.findUnique({
      where: { name: groupName },
    });

    if (!existingGroup) {
      await prisma.group.create({
        data: { name: groupName },
      });
      console.log('Created group:', groupName);
    }
  }

  const devGroup = await prisma.group.findUnique({
    where: { name: 'Разработка' },
  });

  const mgmtGroup = await prisma.group.findUnique({
    where: { name: 'Менеджмент' },
  });

  if (devGroup && mgmtGroup) {
    const existingUsers = await prisma.user.count();

    if (existingUsers === 0) {
      const cto = await prisma.user.create({
        data: {
          fullName: 'Иванов Иван Иванович',
          position: 'CTO',
          groupId: mgmtGroup.id,
        },
      });
      console.log('Created user:', cto.fullName);

      const teamLead = await prisma.user.create({
        data: {
          fullName: 'Петров Петр Петрович',
          position: 'Team Lead',
          groupId: devGroup.id,
          managerId: cto.id,
        },
      });
      console.log('Created user:', teamLead.fullName);

      const dev = await prisma.user.create({
        data: {
          fullName: 'Сидоров Сидор Сидорович',
          position: 'Senior Developer',
          groupId: devGroup.id,
          managerId: teamLead.id,
        },
      });
      console.log('Created user:', dev.fullName);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
