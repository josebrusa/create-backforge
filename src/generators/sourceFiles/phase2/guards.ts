import fs from 'fs-extra';
import path from 'path';

export async function generateGuardsAndPolicies(middlewaresDir: string): Promise<void> {
  const guardsContent = `import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';

/**
 * Guard to check if user is authenticated
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // This should be implemented in auth.ts middleware
  // This is just a placeholder for the guard pattern
  next();
};

/**
 * Guard factory to check user roles
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Assuming user has a role property
    // You'll need to adjust this based on your User model
    const userRole = (req.user as any).role;
    
    if (!userRole || !roles.includes(userRole)) {
      throw new ForbiddenError(\`Required role: \${roles.join(' or ')}\`);
    }

    next();
  };
};

/**
 * Guard factory to check permissions
 */
export const requirePermission = (...permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Assuming user has permissions array
    // You'll need to adjust this based on your User model
    const userPermissions = (req.user as any).permissions || [];
    const hasPermission = permissions.some((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      throw new ForbiddenError(\`Required permission: \${permissions.join(' or ')}\`);
    }

    next();
  };
};

/**
 * Policy function type
 */
export type PolicyFunction<T = any> = (
  user: any,
  resource: T
) => boolean | Promise<boolean>;

/**
 * Policy guard factory
 */
export const authorize = <T = any>(policy: PolicyFunction<T>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Get resource from request (could be from params, body, etc.)
    const resource = (req as any).resource || req.params;

    const isAuthorized = await policy(req.user, resource);

    if (!isAuthorized) {
      throw new ForbiddenError('You do not have permission to perform this action');
    }

    next();
  };
};
`;

  await fs.writeFile(path.join(middlewaresDir, 'guards.ts'), guardsContent);
}
