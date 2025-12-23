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

# Email (Optional - if not configured, uses test account)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@coreback.app
APP_URL=http://localhost:3000
`;
  }

  envContent += `
# Rate Limit
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
`;

  if (config.includeFileUpload) {
    envContent += `
# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
UPLOAD_DIR=uploads
`;
    if (config.fileStorage === 's3') {
      envContent += `
# AWS S3 (if using S3 storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET=your-bucket-name
`;
    }
  }

  if (config.includeRedis) {
    envContent += `
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
`;
  }

  await fs.writeFile(path.join(projectPath, '.env.example'), envContent);
}

