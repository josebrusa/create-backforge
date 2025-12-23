import fs from 'fs-extra';
import path from 'path';

export async function generateTypes(typesDir: string): Promise<void> {
  const indexContent = `export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: unknown[];
}
`;

  await fs.writeFile(path.join(typesDir, 'index.ts'), indexContent);
}
