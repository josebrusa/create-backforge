import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateTests(
  unitTestsDir: string,
  integrationTestsDir: string,
  config: ProjectConfig
): Promise<void> {
  // Unit test example
  const unitTestContent = `import { healthController } from '../../src/controllers/health.controller.js';

describe('Health Controller', () => {
  it('should return ok status', () => {
    const mockReq = {} as any;
    const mockRes = {
      json: jest.fn(),
    } as any;

    healthController.check(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });
});
`;

  await fs.writeFile(
    path.join(unitTestsDir, 'health.controller.test.ts'),
    unitTestContent
  );

  // Integration test example
  const integrationTestContent = `import request from 'supertest';
import express from 'express';
import { setupRoutes } from '../../src/routes/index.js';
import { setupMiddlewares } from '../../src/config/middlewares.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';

const app = express();
setupMiddlewares(app);
setupRoutes(app);
app.use(errorHandler);

describe('Health API', () => {
  it('GET /api/health should return 200', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });
});
`;

  await fs.writeFile(
    path.join(integrationTestsDir, 'health.api.test.ts'),
    integrationTestContent
  );
}
