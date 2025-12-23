import fs from 'fs-extra';
import path from 'path';

export async function generateCursorRules(
  projectPath: string
): Promise<void> {
  const cursorRules = `Proyecto: Backend API con Clean Architecture
Stack: Node.js + TypeScript + Express + Prisma

Arquitectura:
- Controllers: Solo manejo HTTP (req, res, next)
- Services: Lógica de negocio pura
- Repositories: Acceso a datos con Prisma

Reglas:
- SIEMPRE validar con Zod antes de procesar datos
- SIEMPRE usar try-catch y pasar errores a next()
- NUNCA poner lógica de negocio en controllers
- Usar imports absolutos con alias @/ para src/
- Logging con winston para todos los errores
- Tests obligatorios para servicios críticos

Prisma:
- Usar transacciones para operaciones múltiples
- Siempre incluir select para optimizar queries

Auth:
- JWT en header Authorization: Bearer <token>
- Passwords hasheados con bcrypt (10 rounds)
- Refresh tokens en base de datos

Swagger:
- Documentar TODOS los endpoints con JSDoc
- Incluir ejemplos de request/response
`;

  await fs.writeFile(path.join(projectPath, '.cursorrules'), cursorRules);
}

