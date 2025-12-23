import fs from 'fs-extra';
import path from 'path';

export async function generateModuleSystem(srcDir: string): Promise<void> {
  const modulesDir = path.join(srcDir, 'modules');
  await fs.ensureDir(modulesDir);

  const moduleContent = `import { Express } from 'express';
import { container } from '../di/container.js';

export interface ModuleConfig {
  name: string;
  routes?: (app: Express) => void;
  services?: Array<{ identifier: string | symbol; factory: any; singleton?: boolean }>;
  middlewares?: Array<(app: Express) => void>;
  onInit?: () => void | Promise<void>;
  onDestroy?: () => void | Promise<void>;
}

export class Module {
  private config: ModuleConfig;

  constructor(config: ModuleConfig) {
    this.config = config;
  }

  /**
   * Register module services
   */
  registerServices(): void {
    if (this.config.services) {
      this.config.services.forEach(({ identifier, factory, singleton = true }) => {
        if (singleton) {
          container.singleton(identifier, factory);
        } else {
          container.transient(identifier, factory);
        }
      });
    }
  }

  /**
   * Register module routes
   */
  registerRoutes(app: Express): void {
    if (this.config.routes) {
      this.config.routes(app);
    }
  }

  /**
   * Register module middlewares
   */
  registerMiddlewares(app: Express): void {
    if (this.config.middlewares) {
      this.config.middlewares.forEach((middleware) => middleware(app));
    }
  }

  /**
   * Initialize module
   */
  async init(): Promise<void> {
    this.registerServices();
    if (this.config.onInit) {
      await this.config.onInit();
    }
  }

  /**
   * Destroy module
   */
  async destroy(): Promise<void> {
    if (this.config.onDestroy) {
      await this.config.onDestroy();
    }
  }

  getName(): string {
    return this.config.name;
  }
}

/**
 * Module registry
 */
class ModuleRegistry {
  private modules: Map<string, Module> = new Map();

  /**
   * Register a module
   */
  register(module: Module): void {
    this.modules.set(module.getName(), module);
  }

  /**
   * Get a module
   */
  get(name: string): Module | undefined {
    return this.modules.get(name);
  }

  /**
   * Get all modules
   */
  getAll(): Module[] {
    return Array.from(this.modules.values());
  }

  /**
   * Initialize all modules
   */
  async initAll(): Promise<void> {
    for (const module of this.modules.values()) {
      await module.init();
    }
  }

  /**
   * Register all routes
   */
  registerRoutes(app: Express): void {
    for (const module of this.modules.values()) {
      module.registerRoutes(app);
    }
  }

  /**
   * Register all middlewares
   */
  registerMiddlewares(app: Express): void {
    for (const module of this.modules.values()) {
      module.registerMiddlewares(app);
    }
  }
}

export const moduleRegistry = new ModuleRegistry();
`;

  await fs.writeFile(path.join(modulesDir, 'module.ts'), moduleContent);

  // Example module
  const exampleModuleContent = `import { Module } from './module.js';
import { Express } from 'express';
import { healthRoutes } from '../routes/health.routes.js';

/**
 * Example: Health Module
 */
export const healthModule = new Module({
  name: 'health',
  routes: (app: Express) => {
    app.use('/api/health', healthRoutes);
  },
  services: [
    {
      identifier: 'healthService',
      factory: () => ({
        check: () => ({ status: 'ok' }),
      }),
      singleton: true,
    },
  ],
});
`;

  await fs.writeFile(path.join(modulesDir, 'examples.ts'), exampleModuleContent);
}
