import { ProjectConfig } from '../../types.js';
import fs from 'fs-extra';
import path from 'path';
import { generateCoreFiles } from './core/index.js';
import { generateControllers } from './controllers/index.js';
import { generateServices } from './services/index.js';
import { generateRepositories } from './repositories/index.js';
import { generateTests } from './core/tests.js';
import { generateFileUpload } from './features/fileUpload.js';
import { generateRedisCache } from './features/redis.js';
import { generateQueueSystem } from './features/queue.js';
import { generateCLIGenerators } from './phase1/cliGenerators.js';
import { generateSeedersAndFactories } from './phase1/seedersFactories.js';
import { generateDTOs } from './phase2/dtos.js';
import { generateEventsAndListeners } from './phase2/events.js';
import { generateScheduledTasks } from './phase2/scheduledTasks.js';
import { generateAdvancedHealthChecks } from './phase2/healthChecks.js';
import { generateAdvancedExceptionHandling } from './phase2/exceptionHandling.js';
import { generateGuardsAndPolicies } from './phase2/guards.js';
import { generateDependencyInjection } from './phase3/dependencyInjection.js';
import { generateModuleSystem } from './phase3/moduleSystem.js';
import { generateCLICommands } from './phase3/cliCommands.js';
import { generateConfigSystem } from './phase3/configSystem.js';
import { generateAPIVersioning } from './phase3/apiVersioning.js';
import { generateStructuredLogging } from './phase3/structuredLogging.js';

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
  const uploadsDir = config.includeFileUpload ? path.join(projectPath, 'uploads') : undefined;
  const queueDir = config.includeQueue ? path.join(srcDir, 'queue') : undefined;

  // Create directories
  const dirsToCreate = [
    configDir,
    controllersDir,
    servicesDir,
    repositoriesDir,
    middlewaresDir,
    routesDir,
    typesDir,
    utilsDir,
    validatorsDir,
    unitTestsDir,
    integrationTestsDir,
  ];
  
  if (config.includeFileUpload && uploadsDir) {
    dirsToCreate.push(uploadsDir);
  }
  
  if (config.includeQueue && queueDir) {
    dirsToCreate.push(queueDir);
  }
  
  await Promise.all(dirsToCreate.map(dir => fs.ensureDir(dir)));

  // Generate core files
  await generateCoreFiles(
    srcDir,
    configDir,
    middlewaresDir,
    utilsDir,
    routesDir,
    typesDir,
    validatorsDir,
    config
  );

  // Generate controllers, services, repositories
  await generateControllers(controllersDir, config);
  await generateServices(servicesDir, config);
  await generateRepositories(repositoriesDir, config);
  await generateTests(unitTestsDir, integrationTestsDir, config);
  
  // Generate optional features
  if (config.includeFileUpload) {
    await generateFileUpload(controllersDir, servicesDir, routesDir, validatorsDir, config);
  }
  
  if (config.includeRedis) {
    await generateRedisCache(servicesDir, config);
  }
  
  if (config.includeQueue && queueDir) {
    await generateQueueSystem(queueDir, routesDir, config);
  }

  // Generate Phase 1 features
  await generateCLIGenerators(projectPath);
  await generateSeedersAndFactories(projectPath, config);

  // Generate Phase 2 features
  await generateDTOs(validatorsDir);
  await generateEventsAndListeners(srcDir);
  await generateScheduledTasks(srcDir);
  await generateAdvancedHealthChecks(controllersDir, config);
  await generateAdvancedExceptionHandling(middlewaresDir);
  if (config.includeAuth) {
    await generateGuardsAndPolicies(middlewaresDir);
  }

  // Generate Phase 3 features
  await generateDependencyInjection(srcDir);
  await generateModuleSystem(srcDir);
  await generateCLICommands(projectPath);
  await generateConfigSystem(configDir);
  await generateAPIVersioning(routesDir, config);
  await generateStructuredLogging(utilsDir, config);
}

