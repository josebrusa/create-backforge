import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateControllers(controllersDir: string, config: ProjectConfig): Promise<void> {
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

  verifyEmail: async (req: AuthRequest, res: Response) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        throw new AppError(400, 'Verification token is required');
      }
      const result = await authService.verifyEmail(token);
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to verify email');
    }
  },

  resendVerification: async (req: AuthRequest, res: Response) => {
    try {
      const { email } = req.body;
      const result = await authService.resendVerificationEmail(email);
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to resend verification email');
    }
  },

  forgotPassword: async (req: AuthRequest, res: Response) => {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to send password reset email');
    }
  },

  resetPassword: async (req: AuthRequest, res: Response) => {
    try {
      const { token } = req.query;
      const { password } = req.body;
      if (!token || typeof token !== 'string') {
        throw new AppError(400, 'Reset token is required');
      }
      const result = await authService.resetPassword(token, password);
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to reset password');
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
