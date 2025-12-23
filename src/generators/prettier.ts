import fs from 'fs-extra';
import path from 'path';

export async function generatePrettierConfig(
  projectPath: string
): Promise<void> {
  const prettierConfig = {
    semi: true,
    trailingComma: 'es5' as const,
    singleQuote: true,
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
  };

  await fs.writeJSON(
    path.join(projectPath, '.prettierrc'),
    prettierConfig,
    { spaces: 2 }
  );
}

