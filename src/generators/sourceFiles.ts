import { ProjectConfig } from '../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateSourceFiles(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const srcDir = path.join(projectPath, 'src');
  const configDir = path.join(srcDir, 'config');
  const controllersDir = path.join(srcDir, 'controllers');
  const servicesDir = path.join(srcDir, 'services');
  const repositoriesDir = path.join(srcDir, 'repositories');
  const middlewaresDir = path.join(srcDir, 'middlewares');
  const routesDir = path.join(srcDir, 'routes');
  const typesDir = path.join(srcDir, 'types');
  const utilsDir = path.join(srcDir, 'utils');
  const validatorsDir = path.join(srcDir, 'validators');
  const testsDir = path.join(projectPath, 'tests');
  const unitTestsDir = path.join(testsDir, 'unit');
  const integrationTestsDir = path.join(testsDir, 'integration');

  // Create directories
  await Promise.all([
    fs.ensureDir(configDir),
    fs.ensureDir(controllersDir),
    fs.ensureDir(servicesDir),
    fs.ensureDir(repositoriesDir),
    fs.ensureDir(middlewaresDir),
    fs.ensureDir(routesDir),
    fs.ensureDir(typesDir),
    fs.ensureDir(utilsDir),
    fs.ensureDir(validatorsDir),
    fs.ensureDir(unitTestsDir),
    fs.ensureDir(integrationTestsDir),
  ]);

  // Generate files
  await generateIndex(srcDir, config);
  await generateConfigFiles(configDir, config);
  await generateMiddlewares(middlewaresDir, config);
  await generateUtils(utilsDir);
  await generateRoutes(routesDir, config);
  await generateTypes(typesDir);
  await generateValidators(validatorsDir, config);
  await generateControllers(controllersDir, config);
  await generateServices(servicesDir, config);
  await generateRepositories(repositoriesDir, config);
  await generateTests(unitTestsDir, integrationTestsDir, config);
}

async function generateIndex(srcDir: string, config: ProjectConfig): Promise<void> {
  const indexContent = `import express from 'express';
import { config } from './config/env.js';
import { setupMiddlewares } from './config/middlewares.js';
import { setupRoutes } from './routes/index.js';
import { setupSwagger } from './config/swagger.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

setupMiddlewares(app);
setupSwagger(app);
setupRoutes(app);
app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  logger.info(\`🚀 Server: http://localhost:\${config.PORT}\`);
  logger.info(\`📚 Docs: http://localhost:\${config.PORT}/api-docs\`);
});

process.on('SIGTERM', () => {
  server.close();
  process.exit(0);
});
`;

  await fs.writeFile(path.join(srcDir, 'index.ts'), indexContent);
}

async function generateConfigFiles(configDir: string, config: ProjectConfig): Promise<void> {
  // env.ts
  const envContent = `import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
${config.includeAuth ? `  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),` : ''}
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

export const config = envSchema.parse(process.env);
`;

  await fs.writeFile(path.join(configDir, 'env.ts'), envContent);

  // database.ts
  const databaseContent = `import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  logger.debug('Query: ' + e.query);
  logger.debug('Params: ' + e.params);
  logger.debug('Duration: ' + e.duration + 'ms');
});

export { prisma };
`;

  await fs.writeFile(path.join(configDir, 'database.ts'), databaseContent);

  // middlewares.ts
  const middlewaresContent = `import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './env.js';

export function setupMiddlewares(app: Express): void {
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    message: 'Too many requests from this IP, please try again later.',
  });

  app.use('/api/', limiter);
}
`;

  await fs.writeFile(path.join(configDir, 'middlewares.ts'), middlewaresContent);

  // swagger.ts
  const swaggerContent = `import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CoreBack API',
      version: '1.0.0',
      description: 'Production-ready backend API',
    },
    servers: [
      {
        url: \`http://localhost:\${config.PORT}\`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
`;

  await fs.writeFile(path.join(configDir, 'swagger.ts'), swaggerContent);
}

async function generateMiddlewares(middlewaresDir: string, config: ProjectConfig): Promise<void> {
  // errorHandler.ts
  const errorHandlerContent = `import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.errors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
`;

  await fs.writeFile(path.join(middlewaresDir, 'errorHandler.ts'), errorHandlerContent);

  // validator.ts
  const validatorContent = `import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation error',
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};
`;

  await fs.writeFile(path.join(middlewaresDir, 'validator.ts'), validatorContent);

  if (config.includeAuth) {
    // auth.ts
    const authContent = `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from './errorHandler.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      email: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
};
`;

    await fs.writeFile(path.join(middlewaresDir, 'auth.ts'), authContent);
  }
}

async function generateUtils(utilsDir: string): Promise<void> {
  const loggerContent = `import winston from 'winston';
import { config } from '../config/env.js';
import fs from 'fs-extra';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
fs.ensureDirSync(logsDir);

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'coreback-api' },
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
  ],
});

if (config.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}
`;

  await fs.writeFile(path.join(utilsDir, 'logger.ts'), loggerContent);
}

async function generateRoutes(routesDir: string, config: ProjectConfig): Promise<void> {
  // index.ts
  let indexContent = `import { Express } from 'express';
import { healthRoutes } from './health.routes.js';
`;

  if (config.includeAuth) {
    indexContent += `import { authRoutes } from './auth.routes.js';
`;
  }

  indexContent += `
export function setupRoutes(app: Express): void {
  app.use('/api/health', healthRoutes);
`;

  if (config.includeAuth) {
    indexContent += `  app.use('/api/auth', authRoutes);
`;
  }

  indexContent += `}
`;

  await fs.writeFile(path.join(routesDir, 'index.ts'), indexContent);

  // health.routes.ts
  const healthRoutesContent = `import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check endpoints
 */

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   example: 2024-01-01T00:00:00.000Z
 */
router.get('/', healthController.check);

export { router as healthRoutes };
`;

  await fs.writeFile(path.join(routesDir, 'health.routes.ts'), healthRoutesContent);

  if (config.includeAuth) {
    // auth.routes.ts
    const authRoutesContent = `import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validator.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middlewares/auth.js';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, authController.me);

export { router as authRoutes };
`;

    await fs.writeFile(path.join(routesDir, 'auth.routes.ts'), authRoutesContent);
  }
}

async function generateTypes(typesDir: string): Promise<void> {
  const indexContent = `export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: unknown[];
}
`;

  await fs.writeFile(path.join(typesDir, 'index.ts'), indexContent);
}

async function generateValidators(validatorsDir: string, config: ProjectConfig): Promise<void> {
  if (config.includeAuth) {
    const authValidatorContent = `import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});
`;

    await fs.writeFile(path.join(validatorsDir, 'auth.validator.ts'), authValidatorContent);
  }
}

async function generateControllers(controllersDir: string, config: ProjectConfig): Promise<void> {
  // health.controller.ts
  const healthControllerContent = `import { Request, Response } from 'express';

export const healthController = {
  check: (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  },
};
`;

  await fs.writeFile(
    path.join(controllersDir, 'health.controller.ts'),
    healthControllerContent
  );

  if (config.includeAuth) {
    // auth.controller.ts
    const authControllerContent = `import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { authService } from '../services/auth.service.js';
import { AppError } from '../middlewares/errorHandler.js';

export const authController = {
  register: async (req: AuthRequest, res: Response) => {
    try {
      const { email, password, name } = req.body;
      const user = await authService.register(email, password, name);
      res.status(201).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to register user');
    }
  },

  login: async (req: AuthRequest, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to login');
    }
  },

  me: async (req: AuthRequest, res: Response) => {
    try {
      const user = await authService.getUserById(req.user!.id);
      res.json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to get user');
    }
  },
};
`;

    await fs.writeFile(
      path.join(controllersDir, 'auth.controller.ts'),
      authControllerContent
    );
  }
}

async function generateServices(servicesDir: string, config: ProjectConfig): Promise<void> {
  if (config.includeAuth) {
    const authServiceContent = `import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/errorHandler.js';

export const authService = {
  async register(email: string, password: string, name?: string) {
    const existingUser = await userRepository.findByEmail(email);
    
    if (existingUser) {
      throw new AppError(400, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  },

  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
};
`;

    await fs.writeFile(
      path.join(servicesDir, 'auth.service.ts'),
      authServiceContent
    );
  }
}

async function generateRepositories(repositoriesDir: string, config: ProjectConfig): Promise<void> {
  if (config.includeAuth) {
    const userRepositoryContent = `import { prisma } from '../config/database.js';

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async create(data: { email: string; password: string; name?: string }) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
};
`;

    await fs.writeFile(
      path.join(repositoriesDir, 'user.repository.ts'),
      userRepositoryContent
    );
  }
}

async function generateTests(
  unitTestsDir: string,
  integrationTestsDir: string,
  config: ProjectConfig
): Promise<void> {
  // Unit test example
  const unitTestContent = `import { healthController } from '../../src/controllers/health.controller.js';

describe('Health Controller', () => {
  it('should return ok status', () => {
    const mockReq = {} as any;
    const mockRes = {
      json: jest.fn(),
    } as any;

    healthController.check(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });
});
`;

  await fs.writeFile(
    path.join(unitTestsDir, 'health.controller.test.ts'),
    unitTestContent
  );

  // Integration test example
  const integrationTestContent = `import request from 'supertest';
import express from 'express';
import { setupRoutes } from '../../src/routes/index.js';
import { setupMiddlewares } from '../../src/config/middlewares.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';

const app = express();
setupMiddlewares(app);
setupRoutes(app);
app.use(errorHandler);

describe('Health API', () => {
  it('GET /api/health should return 200', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });
});
`;

  await fs.writeFile(
    path.join(integrationTestsDir, 'health.api.test.ts'),
    integrationTestContent
  );
}

