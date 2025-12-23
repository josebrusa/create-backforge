import fs from 'fs-extra';
import path from 'path';

export async function generateCLIGenerators(projectPath: string): Promise<void> {
  const scriptsDir = path.join(projectPath, 'scripts');
  await fs.ensureDir(scriptsDir);

  // make.ts - CLI generator
  const makeContent = `#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const templates = {
  controller: \`import { Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler.js';

export const {{name}}Controller = {
  index: async (req: Request, res: Response) => {
    try {
      res.json({
        status: 'success',
        data: [],
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to fetch {{name}}');
    }
  },

  show: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      res.json({
        status: 'success',
        data: { id },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to fetch {{name}}');
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      res.status(201).json({
        status: 'success',
        data: req.body,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to create {{name}}');
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      res.json({
        status: 'success',
        data: { id, ...req.body },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to update {{name}}');
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      res.json({
        status: 'success',
        message: '{{name}} deleted successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to delete {{name}}');
    }
  },
};
\`,

  service: \`import { AppError } from '../middlewares/errorHandler.js';

export const {{name}}Service = {
  findAll: async () => {
    // Implement your logic here
    return [];
  },

  findById: async (id: string) => {
    // Implement your logic here
    return { id };
  },

  create: async (data: unknown) => {
    // Implement your logic here
    return data;
  },

  update: async (id: string, data: unknown) => {
    // Implement your logic here
    return { id, ...data };
  },

  delete: async (id: string) => {
    // Implement your logic here
    return true;
  },
};
\`,

  repository: \`import { prisma } from '../config/database.js';

export const {{name}}Repository = {
  findAll: async () => {
    return prisma.{{modelName}}.findMany();
  },

  findById: async (id: string) => {
    return prisma.{{modelName}}.findUnique({
      where: { id },
    });
  },

  create: async (data: unknown) => {
    return prisma.{{modelName}}.create({
      data: data as any,
    });
  },

  update: async (id: string, data: unknown) => {
    return prisma.{{modelName}}.update({
      where: { id },
      data: data as any,
    });
  },

  delete: async (id: string) => {
    return prisma.{{modelName}}.delete({
      where: { id },
    });
  },
};
\`,

  route: \`import { Router } from 'express';
import { {{name}}Controller } from '../controllers/{{name}}.controller.js';
// Uncomment if you need authentication:
// import { authenticate } from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: {{Name}}
 *   description: {{Name}} management endpoints
 */

// Uncomment if you need authentication:
// router.use(authenticate);

/**
 * @swagger
 * /api/{{name}}:
 *   get:
 *     summary: Get all {{name}}
 *     tags: [{{Name}}]
 *     responses:
 *       200:
 *         description: List of {{name}}
 */
router.get('/', {{name}}Controller.index);

/**
 * @swagger
 * /api/{{name}}/{id}:
 *   get:
 *     summary: Get {{name}} by ID
 *     tags: [{{Name}}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: {{Name}} details
 */
router.get('/:id', {{name}}Controller.show);

/**
 * @swagger
 * /api/{{name}}:
 *   post:
 *     summary: Create {{name}}
 *     tags: [{{Name}}]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: {{Name}} created
 */
router.post('/', {{name}}Controller.create);

/**
 * @swagger
 * /api/{{name}}/{id}:
 *   put:
 *     summary: Update {{name}}
 *     tags: [{{Name}}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: {{Name}} updated
 */
router.put('/:id', {{name}}Controller.update);

/**
 * @swagger
 * /api/{{name}}/{id}:
 *   delete:
 *     summary: Delete {{name}}
 *     tags: [{{Name}}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: {{Name}} deleted
 */
router.delete('/:id', {{name}}Controller.delete);

export { router as {{name}}Routes };
\`,
};

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function replacePlaceholders(content: string, name: string, modelName?: string): string {
  const Name = toPascalCase(name);
  const camelName = toCamelCase(name);
  const model = modelName || Name;
  
  return content
    .replace(/{{name}}/g, camelName)
    .replace(/{{Name}}/g, Name)
    .replace(/{{modelName}}/g, model.toLowerCase());
}

async function generateFile(type: string, name: string, modelName?: string) {
  const template = templates[type as keyof typeof templates];
  if (!template) {
    console.error(\`Unknown type: \\\${type}\`);
    process.exit(1);
  }

  const content = replacePlaceholders(template, name, modelName);
  const dirMap: Record<string, string> = {
    controller: 'src/controllers',
    service: 'src/services',
    repository: 'src/repositories',
    route: 'src/routes',
  };

  const dir = path.join(projectRoot, dirMap[type] || 'src');
  await fs.ensureDir(dir);

  const fileName = \`\\\${toCamelCase(name)}.\\\${type === 'route' ? 'routes' : type}.ts\`;
  const filePath = path.join(dir, fileName);

  if (await fs.pathExists(filePath)) {
    console.error(\`File already exists: \\\${filePath}\`);
    process.exit(1);
  }

  await fs.writeFile(filePath, content);
  console.log(\`✅ Created \\\${filePath}\`);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: npm run make:<type> <name> [modelName]');
  console.error('Example: npm run make:controller user');
  console.error('Example: npm run make:repository user User');
  process.exit(1);
}

const [type, name] = args;
const modelName = args[2];

generateFile(type, name, modelName).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
`;

  await fs.writeFile(path.join(scriptsDir, 'make.ts'), makeContent);
}
