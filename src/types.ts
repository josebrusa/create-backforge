export type DatabaseType = 'postgresql' | 'mysql' | 'mongodb' | 'sqlite';
export type PackageManager = 'npm' | 'pnpm' | 'yarn';

export interface ProjectConfig {
  projectName: string;
  database: DatabaseType;
  includeAuth: boolean;
  includeDocker: boolean;
  packageManager: PackageManager;
}

