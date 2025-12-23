export type DatabaseType = 'postgresql' | 'mysql' | 'mongodb' | 'sqlite';
export type PackageManager = 'npm' | 'pnpm' | 'yarn';
export type FileStorageType = 'local' | 's3' | 'none';

export interface ProjectConfig {
  projectName: string;
  database: DatabaseType;
  includeAuth: boolean;
  includeDocker: boolean;
  includeFileUpload: boolean;
  fileStorage: FileStorageType;
  includeRedis: boolean;
  includeQueue: boolean;
  packageManager: PackageManager;
}

