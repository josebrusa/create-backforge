import { ProjectConfig } from '../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateDockerFiles(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  // Dockerfile
  const dockerfile = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run db:generate

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3000
CMD ["npm", "start"]
`;

  await fs.writeFile(path.join(projectPath, 'Dockerfile'), dockerfile);

  // docker-compose.yml
  let dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=\${DATABASE_URL}${config.includeRedis ? `
      - REDIS_HOST=redis
      - REDIS_PORT=6379` : ''}
    depends_on:${config.includeRedis ? `
      - redis` : ''}
`;

  switch (config.database) {
    case 'postgresql':
      dockerCompose += `      - postgres
    networks:
      - backend

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend

volumes:
  postgres_data:${config.includeRedis ? `

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - backend

volumes:
  postgres_data:
  redis_data:` : ''}

networks:
  backend:
`;
      break;
    case 'mysql':
      dockerCompose += `      - mysql
    networks:
      - backend

  mysql:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=mydb
      - MYSQL_USER=user
      - MYSQL_PASSWORD=password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - backend

volumes:
  mysql_data:${config.includeRedis ? `

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - backend

volumes:
  mysql_data:
  redis_data:` : ''}

networks:
  backend:
`;
      break;
    case 'mongodb':
      dockerCompose += `      - mongodb
    networks:
      - backend

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - backend

volumes:
  mongo_data:${config.includeRedis ? `

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - backend

volumes:
  mongo_data:
  redis_data:` : ''}

networks:
  backend:
`;
      break;
    default:
      dockerCompose += `${config.includeRedis ? `      - redis
` : ''}    networks:
      - backend
${config.includeRedis ? `
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - backend

volumes:
  redis_data:

networks:
  backend:
` : `
networks:
  backend:
`}`;
  }

  await fs.writeFile(
    path.join(projectPath, 'docker-compose.yml'),
    dockerCompose
  );
}

