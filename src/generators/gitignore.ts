import fs from 'fs-extra';
import path from 'path';

export async function generateGitIgnore(projectPath: string): Promise<void> {
  const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Production
dist/
build/

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Prisma
*.db
*.db-journal

# TypeScript
*.tsbuildinfo
`;

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);
}

