import fs from 'fs-extra';
import path from 'path';

export async function generateEslintConfig(projectPath: string): Promise<void> {
  // ESLint 9 uses flat config format
  const eslintConfig = `import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['dist', 'node_modules', '*.js'],
  }
);
`;

  await fs.writeFile(
    path.join(projectPath, 'eslint.config.js'),
    eslintConfig
  );
}

