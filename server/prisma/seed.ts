import bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { name: 'Dolbeare Elementary School' },
    update: {},
    create: {
      name: 'Dolbeare Elementary School',
    },
  });

  const passwordHash = await bcrypt.hash('Password123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      firstName: 'Abby',
      lastName: 'Chapman',
      email: 'admin@test.com',
      passwordHash,
      role: UserRole.ADMIN,
      organizationId: organization.id,
    },
  });

  console.log('Seed data created successfully.');
  console.log('Admin login: admin@test.com / Password123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });