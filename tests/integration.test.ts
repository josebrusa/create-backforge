import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

describe('Project Generator Integration Tests', () => {
  const testProjectPath = path.join(projectRoot, 'test-project');
  const testProjectSrc = path.join(testProjectPath, 'src');

  beforeAll(() => {
    // Clean up test project if exists
    if (fs.existsSync(testProjectPath)) {
      fs.removeSync(testProjectPath);
    }
  });

  afterAll(() => {
    // Clean up test project
    if (fs.existsSync(testProjectPath)) {
      fs.removeSync(testProjectPath);
    }
  });

  describe('Project Structure', () => {
    it('should generate project with correct structure', async () => {
      // This would require running the actual generator
      // For now, we'll test that the generator files exist
      const generatorPath = path.join(projectRoot, 'src', 'generators');
      expect(fs.existsSync(generatorPath)).toBe(true);
    });
  });

  describe('Phase 1 Features', () => {
    describe('CLI Generators', () => {
      it('should have make.ts script', () => {
        const makeScript = path.join(projectRoot, 'src', 'generators', 'sourceFiles.ts');
        const content = fs.readFileSync(makeScript, 'utf-8');
        expect(content).toContain('generateCLIGenerators');
        expect(content).toContain('make.ts');
      });

      it('should generate make.ts with correct templates', () => {
        const sourceFiles = path.join(projectRoot, 'src', 'generators', 'sourceFiles.ts');
        const content = fs.readFileSync(sourceFiles, 'utf-8');
        expect(content).toContain('controller');
        expect(content).toContain('service');
        expect(content).toContain('repository');
        expect(content).toContain('route');
      });
    });

    describe('API Resources', () => {
      it('should generate resource.ts utility', () => {
        const sourceFiles = path.join(projectRoot, 'src', 'generators', 'sourceFiles.ts');
        const content = fs.readFileSync(sourceFiles, 'utf-8');
        expect(content).toContain('resource.ts');
        expect(content).toContain('class Resource');
        expect(content).toContain('transformResponse');
      });
    });

    describe('Pagination Helpers', () => {
      it('should generate pagination.ts utility', () => {
        const sourceFiles = path.join(projectRoot, 'src', 'generators', 'sourceFiles.ts');
        const content = fs.readFileSync(sourceFiles, 'utf-8');
        expect(content).toContain('pagination.ts');
        expect(content).toContain('paginate');
        expect(content).toContain('paginateQuery');
        expect(content).toContain('PaginationMeta');
      });
    });

    describe('Seeders and Factories', () => {
      it('should generate seed.ts and factories', () => {
        const sourceFiles = path.join(projectRoot, 'src', 'generators', 'sourceFiles.ts');
        const content = fs.readFileSync(sourceFiles, 'utf-8');
        expect(content).toContain('generateSeedersAndFactories');
        expect(content).toContain('seed.ts');
        expect(content).toContain('user.factory.ts');
      });
    });
  });

  describe('Phase 2 Features', () => {
    describe('DTOs', () => {
      it('should generate DTO system', () => {
        const sourceFiles = path.join(projectRoot, 'src', 'generators', 'sourceFiles.ts');
        const content = fs.readFileSync(sourceFiles, 'utf-8');
        expect(content).toContain('generateDTOs');
        expect(content).toContain('class DTO');
        expect(content).toContain('createDTO');
        expect(content).toContain('PaginationDTO');
        expect(content).toContain('IdDTO');
      });
    });

    describe('Events and Listeners', () => {
      it('should generate events system', () => {
        const sourceFiles = path.join(projectRoot, 'src', 'generators', 'sourceFiles.ts');
        const content = fs.readFileSync(sourceFiles, 'utf-8');
        expect(content).toContain('generateEventsAndListeners');
        expect(content).toContain('eventEmitter.ts');
        expect(content).toContain('Events');
        expect(content).toContain('USER_REGISTERED');
        expect(content).toContain('registerListeners');
      });
    });

    describe('Scheduled Tasks', () => {
      it('should generate scheduled tasks system', () => {
        const sourceFiles = path.join(projectRoot, 'src', 'generators', 'sourceFiles.ts');
        const content = fs.readFileSync(sourceFiles, 'utf-8');
        expect(content).toContain('generateScheduledTasks');
        expect(content).toContain('node-cron');
        expect(content).toContain('registerScheduledTasks');
      });
    });

    describe('Advanced Health Checks', () => {
      it('should generate advanced health checks', () => {
        const sourceFiles = path.join(projectRoot, 'src', 'generators', 'sourceFiles.ts');
        const content = fs.readFileSync(sourceFiles, 'utf-8');
        expect(content).toContain('generateAdvancedHealthChecks');
        expect(content).toContain('HealthCheck');
        expect(content).toContain('database');
        expect(content).toContain('redis');
      });
    });

    describe('Exception Handling', () => {
      it('should generate advanced exception handling', () => {
        const sourceFiles = path.join(projectRoot, 'src', 'generators', 'sourceFiles.ts');
        const content = fs.readFileSync(sourceFiles, 'utf-8');
        expect(content).toContain('generateAdvancedExceptionHandling');
        expect(content).toContain('ValidationError');
        expect(content).toContain('NotFoundError');
        expect(content).toContain('UnauthorizedError');
        expect(content).toContain('ForbiddenError');
        expect(content).toContain('ConflictError');
      });
    });

    describe('Guards and Policies', () => {
      it('should generate guards and policies', () => {
        const sourceFiles = path.join(projectRoot, 'src', 'generators', 'sourceFiles.ts');
        const content = fs.readFileSync(sourceFiles, 'utf-8');
        expect(content).toContain('generateGuardsAndPolicies');
        expect(content).toContain('requireRole');
        expect(content).toContain('requirePermission');
        expect(content).toContain('authorize');
      });
    });
  });

  describe('Package.json Scripts', () => {
    it('should include all CLI generator scripts', () => {
      const packageJson = path.join(projectRoot, 'src', 'generators', 'packageJson.ts');
      const content = fs.readFileSync(packageJson, 'utf-8');
      expect(content).toContain('make:controller');
      expect(content).toContain('make:service');
      expect(content).toContain('make:repository');
      expect(content).toContain('make:route');
      expect(content).toContain('db:seed');
    });

    it('should include node-cron dependency', () => {
      const packageJson = path.join(projectRoot, 'src', 'generators', 'packageJson.ts');
      const content = fs.readFileSync(packageJson, 'utf-8');
      expect(content).toContain('node-cron');
      expect(content).toContain('@types/node-cron');
    });
  });

  describe('Documentation', () => {
    it('should have documentation for all features', () => {
      const docsDir = path.join(projectRoot, 'docs');
      const expectedDocs = [
        '11-cli-generators.md',
        '12-api-resources.md',
        '13-pagination.md',
        '14-seeders-factories.md',
        '15-dtos.md',
        '16-events-listeners.md',
        '17-scheduled-tasks.md',
        '18-health-checks.md',
        '19-exception-handling.md',
        '20-guards-policies.md',
      ];

      expectedDocs.forEach((doc) => {
        const docPath = path.join(docsDir, doc);
        expect(fs.existsSync(docPath)).toBe(true);
      });
    });

    it('should update README with all new docs', () => {
      const readme = path.join(projectRoot, 'docs', 'README.md');
      const content = fs.readFileSync(readme, 'utf-8');
      expect(content).toContain('11-cli-generators.md');
      expect(content).toContain('20-guards-policies.md');
    });
  });

  describe('Integration Points', () => {
    it('should integrate events with auth service', () => {
      const sourceFiles = path.join(projectRoot, 'src', 'generators', 'sourceFiles.ts');
      const content = fs.readFileSync(sourceFiles, 'utf-8');
      expect(content).toContain('eventEmitter.emit(Events.USER_REGISTERED');
      expect(content).toContain('eventEmitter.emit(Events.USER_VERIFIED');
      expect(content).toContain('eventEmitter.emit(Events.PASSWORD_RESET');
    });

    it('should integrate scheduled tasks in index.ts', () => {
      const sourceFiles = path.join(projectRoot, 'src', 'generators', 'sourceFiles.ts');
      const content = fs.readFileSync(sourceFiles, 'utf-8');
      expect(content).toContain('registerScheduledTasks');
      expect(content).toContain('registerListeners');
    });

    it('should include prisma seed configuration', () => {
      const packageJson = path.join(projectRoot, 'src', 'generators', 'packageJson.ts');
      const content = fs.readFileSync(packageJson, 'utf-8');
      expect(content).toContain('prisma');
      expect(content).toContain('seed');
    });
  });
});

