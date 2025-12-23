import { ProjectConfig } from '../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generatePrismaSchema(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const prismaDir = path.join(projectPath, 'prisma');
  await fs.ensureDir(prismaDir);

  let provider = '';
  let url = '';

  switch (config.database) {
    case 'postgresql':
      provider = 'postgresql';
      url = 'env("DATABASE_URL")';
      break;
    case 'mysql':
      provider = 'mysql';
      url = 'env("DATABASE_URL")';
      break;
    case 'mongodb':
      provider = 'mongodb';
      url = 'env("DATABASE_URL")';
      break;
    case 'sqlite':
      provider = 'sqlite';
      url = 'env("DATABASE_URL")';
      break;
  }

  let schema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = ${url}
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
`;

  if (config.includeAuth) {
    schema += `  password  String
`;
  }

  schema += `
  @@map("users")
}
`;

  await fs.writeFile(path.join(prismaDir, 'schema.prisma'), schema);
}

