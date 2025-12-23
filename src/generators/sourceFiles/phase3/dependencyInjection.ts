import fs from 'fs-extra';
import path from 'path';

export async function generateDependencyInjection(srcDir: string): Promise<void> {
  const diDir = path.join(srcDir, 'di');
  await fs.ensureDir(diDir);

  const containerContent = `/**
 * Dependency Injection Container
 * Simple DI container for managing dependencies
 */

type Constructor<T = any> = new (...args: any[]) => T;
type Factory<T = any> = (...args: any[]) => T;
type ServiceIdentifier<T = any> = string | Constructor<T> | symbol;

interface ServiceDefinition<T = any> {
  factory?: Factory<T>;
  instance?: T;
  singleton?: boolean;
  dependencies?: ServiceIdentifier[];
}

class Container {
  private services = new Map<ServiceIdentifier, ServiceDefinition>();
  private instances = new Map<ServiceIdentifier, any>();

  /**
   * Register a service
   */
  register<T>(
    identifier: ServiceIdentifier<T>,
    definition: ServiceDefinition<T>
  ): void {
    this.services.set(identifier, definition);
  }

  /**
   * Register a singleton service
   */
  singleton<T>(
    identifier: ServiceIdentifier<T>,
    factory: Factory<T> | Constructor<T>,
    dependencies: ServiceIdentifier[] = []
  ): void {
    this.register(identifier, {
      factory: typeof factory === 'function' && factory.prototype
        ? (...args: any[]) => new (factory as Constructor<T>)(...args)
        : factory as Factory<T>,
      singleton: true,
      dependencies,
    });
  }

  /**
   * Register a transient service (new instance each time)
   */
  transient<T>(
    identifier: ServiceIdentifier<T>,
    factory: Factory<T> | Constructor<T>,
    dependencies: ServiceIdentifier[] = []
  ): void {
    this.register(identifier, {
      factory: typeof factory === 'function' && factory.prototype
        ? (...args: any[]) => new (factory as Constructor<T>)(...args)
        : factory as Factory<T>,
      singleton: false,
      dependencies,
    });
  }

  /**
   * Resolve a service
   */
  resolve<T>(identifier: ServiceIdentifier<T>): T {
    // Check if instance already exists (for singletons)
    if (this.instances.has(identifier)) {
      return this.instances.get(identifier) as T;
    }

    const definition = this.services.get(identifier);
    if (!definition) {
      throw new Error(\`Service \${String(identifier)} not found\`);
    }

    // Resolve dependencies
    const dependencies = (definition.dependencies || []).map((dep) =>
      this.resolve(dep)
    );

    // Create instance
    let instance: T;
    if (definition.factory) {
      instance = definition.factory(...dependencies);
    } else if (definition.instance) {
      instance = definition.instance;
    } else {
      throw new Error(\`No factory or instance provided for \${String(identifier)}\`);
    }

    // Store instance if singleton
    if (definition.singleton) {
      this.instances.set(identifier, instance);
    }

    return instance;
  }

  /**
   * Check if service is registered
   */
  has(identifier: ServiceIdentifier): boolean {
    return this.services.has(identifier);
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
  }
}

export const container = new Container();

/**
 * Decorator for dependency injection (optional, for class-based services)
 */
export function Injectable(identifier?: ServiceIdentifier) {
  return function <T extends Constructor>(target: T) {
    const id = identifier || target;
    container.singleton(id, target);
    return target;
  };
}

/**
 * Inject decorator (optional, for property injection)
 */
export function Inject(identifier: ServiceIdentifier) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        return container.resolve(identifier);
      },
      enumerable: true,
      configurable: true,
    });
  };
}
`;

  await fs.writeFile(path.join(diDir, 'container.ts'), containerContent);
}
