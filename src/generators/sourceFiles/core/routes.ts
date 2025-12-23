import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateRoutes(routesDir: string, config: ProjectConfig): Promise<void> {
  // index.ts
  let indexContent = `import { Express } from 'express';
import { healthRoutes } from './health.routes.js';
`;

  if (config.includeAuth) {
    indexContent += `import { authRoutes } from './auth.routes.js';
`;
  }

  if (config.includeFileUpload) {
    indexContent += `import { fileUploadRoutes } from './fileUpload.routes.js';
`;
  }

  if (config.includeQueue) {
    indexContent += `import { queueRoutes } from './queue.routes.js';
import { queueDashboardRouter } from '../queue/dashboard.js';
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

  if (config.includeFileUpload) {
    indexContent += `  app.use('/api/files', fileUploadRoutes);
`;
  }

  if (config.includeQueue) {
    indexContent += `  app.use('/api/queue', queueRoutes);
  app.use('/admin/queues', queueDashboardRouter);
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
import { registerSchema, loginSchema, emailSchema, resetPasswordSchema } from '../validators/auth.validator.js';
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

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify email address
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: Email already verified
 */
router.post('/resend-verification', validate(emailSchema), authController.resendVerification);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post('/forgot-password', validate(emailSchema), authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export { router as authRoutes };
`;

    await fs.writeFile(path.join(routesDir, 'auth.routes.ts'), authRoutesContent);
  }
}
