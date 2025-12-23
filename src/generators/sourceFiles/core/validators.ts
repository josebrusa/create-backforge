import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateValidators(validatorsDir: string, config: ProjectConfig): Promise<void> {
  if (config.includeAuth) {
    const authValidatorContent = `import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const emailSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});
`;

    await fs.writeFile(path.join(validatorsDir, 'auth.validator.ts'), authValidatorContent);
  }
}
