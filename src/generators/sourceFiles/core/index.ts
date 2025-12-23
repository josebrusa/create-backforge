import { ProjectConfig } from '../../../types.js';
import { generateIndex } from './indexFile.js';
import { generateConfigFiles } from './configFiles.js';
import { generateMiddlewares } from './middlewares.js';
import { generateUtils } from './utils.js';
import { generateRoutes } from './routes.js';
import { generateTypes } from './types.js';
import { generateValidators } from './validators.js';

export async function generateCoreFiles(
  srcDir: string,
  configDir: string,
  middlewaresDir: string,
  utilsDir: string,
  routesDir: string,
  typesDir: string,
  validatorsDir: string,
  config: ProjectConfig
): Promise<void> {
  await generateIndex(srcDir, config);
  await generateConfigFiles(configDir, config);
  await generateMiddlewares(middlewaresDir, config);
  await generateUtils(utilsDir);
  await generateRoutes(routesDir, config);
  await generateTypes(typesDir);
  await generateValidators(validatorsDir, config);
}

