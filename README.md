# @josebrusa/create-backforge

CLI tool to generate production-ready backend projects with Node.js, TypeScript, and Express.

## Installation

```bash
npm install -g @josebrusa/create-backforge
# or
pnpm add -g @josebrusa/create-backforge
# or
yarn global add @josebrusa/create-backforge
```

## Usage

```bash
# Interactive mode
pnpm create @josebrusa/backforge

# With project name
pnpm create @josebrusa/backforge my-api
```

## Features

- 🚀 **Production-ready** - Includes all best practices and security measures
- 🎯 **Interactive CLI** - Easy setup with guided prompts
- 🗄️ **Multiple Databases** - PostgreSQL, MySQL, MongoDB, SQLite support
- 🔐 **JWT Authentication** - Optional authentication system
- 🐳 **Docker Support** - Ready-to-use Docker configuration
- 📚 **Swagger/OpenAPI** - Auto-generated API documentation
- 🧪 **Testing Setup** - Jest configured with examples
- 🔧 **TypeScript** - Strict TypeScript configuration
- 📦 **Clean Architecture** - Organized folder structure

## Generated Project Structure

```
my-backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # HTTP handlers
│   ├── services/         # Business logic
│   ├── repositories/     # Data access layer
│   ├── middlewares/      # Express middlewares
│   ├── routes/           # Route definitions
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── validators/       # Zod schemas
├── prisma/
│   └── schema.prisma     # Database schema
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
└── ...
```

## License

MIT

