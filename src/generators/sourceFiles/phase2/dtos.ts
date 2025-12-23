import fs from 'fs-extra';
import path from 'path';

export async function generateDTOs(validatorsDir: string): Promise<void> {
  const dtoContent = `import { z } from 'zod';

/**
 * Base DTO class with Zod validation
 */
export class DTO<T extends z.ZodTypeAny> {
  constructor(private schema: T) {}

  /**
   * Validate and parse data
   */
  parse(data: unknown): z.infer<T> {
    return this.schema.parse(data);
  }

  /**
   * Safe parse (returns result object)
   */
  safeParse(data: unknown): z.SafeParseReturnType<unknown, z.infer<T>> {
    return this.schema.safeParse(data);
  }

  /**
   * Get the schema
   */
  getSchema(): T {
    return this.schema;
  }
}

/**
 * Create a DTO from a Zod schema
 */
export function createDTO<T extends z.ZodTypeAny>(schema: T): DTO<T> {
  return new DTO(schema);
}

/**
 * Common DTOs
 */
export const PaginationDTO = createDTO(
  z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
  })
);

export const IdDTO = createDTO(
  z.object({
    id: z.string().min(1),
  })
);
`;

  await fs.writeFile(path.join(validatorsDir, 'dto.ts'), dtoContent);
}
