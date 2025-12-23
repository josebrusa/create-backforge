import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateSeedersAndFactories(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const prismaDir = path.join(projectPath, 'prisma');
  const factoriesDir = path.join(projectPath, 'src', 'factories');
  await fs.ensureDir(factoriesDir);

  // seed.ts
  const seedContent = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Add your seed data here
  // Example:
  // await prisma.user.create({
  //   data: {
  //     email: 'admin@example.com',
  //     password: '$2b$10$...', // hashed password
  //     name: 'Admin User',
  //     emailVerified: true,
  //   },
  // });

  console.log('✅ Seeding completed');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

  await fs.writeFile(path.join(prismaDir, 'seed.ts'), seedContent);

  // user.factory.ts (if auth is enabled)
  if (config.includeAuth) {
    const userFactoryContent = `import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserFactoryData {
  email?: string;
  password?: string;
  name?: string;
  emailVerified?: boolean;
}

export async function createUser(data: UserFactoryData = {}) {
  const defaultPassword = data.password || 'password123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  return prisma.user.create({
    data: {
      email: data.email || \`user-\${Date.now()}@example.com\`,
      password: hashedPassword,
      name: data.name || 'Test User',
      emailVerified: data.emailVerified ?? true,
    },
  });
}

export async function createManyUsers(count: number, data: UserFactoryData = {}) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const defaultPassword = data.password || 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    users.push({
      email: data.email || \`user-\${Date.now()}-\${i}@example.com\`,
      password: hashedPassword,
      name: data.name || \`Test User \${i + 1}\`,
      emailVerified: data.emailVerified ?? true,
    });
  }

  return prisma.user.createMany({
    data: users,
  });
}
`;

    await fs.writeFile(path.join(factoriesDir, 'user.factory.ts'), userFactoryContent);
  }
}
