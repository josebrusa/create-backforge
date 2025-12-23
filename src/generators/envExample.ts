import { ProjectConfig } from '../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateEnvExample(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  let databaseUrl = '';
  
  switch (config.database) {
    case 'postgresql':
      databaseUrl = 'postgresql://user:password@localhost:5432/mydb';
      break;
    case 'mysql':
      databaseUrl = 'mysql://user:password@localhost:3306/mydb';
      break;
    case 'mongodb':
      databaseUrl = 'mongodb://localhost:27017/mydb';
      break;
    case 'sqlite':
      databaseUrl = 'file:./dev.db';
      break;
  }

  let envContent = `NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="${databaseUrl}"
`;

  if (config.includeAuth) {
    envContent += `
# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
`;
  }

  envContent += `
# Rate Limit
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
`;

  await fs.writeFile(path.join(projectPath, '.env.example'), envContent);
}

