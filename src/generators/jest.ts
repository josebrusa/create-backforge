import fs from 'fs-extra';
import path from 'path';

export async function generateJestConfig(projectPath: string): Promise<void> {
  const jestConfig = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
      '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
      '!src/index.ts',
    ],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
  };

  await fs.writeJSON(
    path.join(projectPath, 'jest.config.js'),
    jestConfig,
    { spaces: 2 }
  );
}

