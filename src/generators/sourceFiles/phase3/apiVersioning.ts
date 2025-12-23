import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateAPIVersioning(
  routesDir: string,
  config: ProjectConfig
): Promise<void> {
  const versioningContent = `import { Express, Request, Response, NextFunction } from 'express';

export interface VersionedRoute {
  version: string;
  handler: (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
}

/**
 * API Versioning Middleware
 */
export function apiVersioning(
  routes: Map<string, VersionedRoute[]>,
  defaultVersion: string = 'v1'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get version from header, query, or path
    const version =
      req.headers['api-version'] ||
      (req.query.version as string) ||
      req.path.split('/')[2]?.replace('v', '') ||
      defaultVersion;

    const versionKey = version.startsWith('v') ? version : \`v\${version}\`;
    (req as any).apiVersion = versionKey;

    next();
  };
}

/**
 * Versioned route handler
 */
export function versionedRoute(
  route: string,
  versions: VersionedRoute[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = (req as any).apiVersion || 'v1';
    const handler = versions.find((v) => v.version === version);

    if (!handler) {
      return res.status(404).json({
        status: 'error',
        message: \`API version \${version} not found for this route\`,
      });
    }

    return handler.handler(req, res, next);
  };
}

/**
 * Example usage:
 * 
 * const userRoutes = Router();
 * 
 * userRoutes.get(
 *   '/users',
 *   apiVersioning(new Map()),
 *   versionedRoute('/users', [
 *     { version: 'v1', handler: userControllerV1.index },
 *     { version: 'v2', handler: userControllerV2.index },
 *   ])
 * );
 */
`;

  await fs.writeFile(path.join(routesDir, 'versioning.ts'), versioningContent);
}
