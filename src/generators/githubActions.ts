import { ProjectConfig } from '../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateGitHubActions(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const workflowsDir = path.join(
    projectPath,
    '.github',
    'workflows'
  );
  await fs.ensureDir(workflowsDir);

  const ciYml = `name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
${config.database === 'postgresql' ? `      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: user
          POSTGRES_PASSWORD: password
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432` : config.database === 'mysql' ? `      mysql:
        image: mysql:8
        env:
          MYSQL_ROOT_PASSWORD: rootpassword
          MYSQL_DATABASE: testdb
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
        ports:
          - 3306:3306` : ''}
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: '${config.packageManager}'
      
      - name: Install dependencies
        run: ${config.packageManager} install
      
      - name: Run linter
        run: ${config.packageManager} run lint
      
      - name: Run tests
        run: ${config.packageManager} run test
        env:
          DATABASE_URL: ${config.database === 'postgresql' ? '"postgresql://user:password@localhost:5432/testdb"' : config.database === 'mysql' ? '"mysql://root:rootpassword@localhost:3306/testdb"' : '"file:./test.db"'}
      
      - name: Build
        run: ${config.packageManager} run build
`;

  await fs.writeFile(path.join(workflowsDir, 'ci.yml'), ciYml);
}

