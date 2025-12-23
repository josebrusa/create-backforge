# create-coreback

CLI tool to generate production-ready backend projects with Node.js, TypeScript, and Express.

## Installation

```bash
npm install -g create-coreback
# or
pnpm add -g create-coreback
# or
yarn global add create-coreback
```

## Usage

```bash
# Interactive mode
pnpm create coreback

# With project name
pnpm create coreback my-project
```

## Features

### Core Features
- 🚀 **Production-ready** - Includes all best practices and security measures
- 🎯 **Interactive CLI** - Easy setup with guided prompts
- 🗄️ **Multiple Databases** - PostgreSQL, MySQL, MongoDB, SQLite support
- 🔐 **JWT Authentication** - Complete authentication system with email verification and password reset
- 🐳 **Docker Support** - Ready-to-use Docker configuration
- 📚 **Swagger/OpenAPI** - Auto-generated API documentation
- 🧪 **Testing Setup** - Jest configured with examples
- 🔧 **TypeScript** - Strict TypeScript configuration
- 📦 **Clean Architecture** - Organized folder structure

### Optional Features
- 📤 **File Upload System** - Local storage or AWS S3 integration
- ⚡ **Redis Cache** - Advanced caching and rate limiting
- 🔄 **Queue System** - Background jobs with Bull/BullMQ and dashboard
- 📊 **Queue Dashboard** - Visual interface for monitoring queues

### Phase 1: Core Infrastructure
- 🛠️ **CLI Generators** - Generate controllers, services, repositories, and routes with `make:*` commands
- 📄 **API Resources/Transformers** - Standardized response formatting
- 📑 **Pagination Helpers** - Built-in pagination utilities
- 🌱 **Database Seeders & Factories** - Data seeding and factory patterns

### Phase 2: Advanced Features
- ✅ **DTOs with Validation** - Zod-based Data Transfer Objects
- 📢 **Events & Listeners** - Event-driven architecture
- ⏰ **Scheduled Tasks** - Cron jobs with node-cron
- 🏥 **Advanced Health Checks** - Database and Redis status monitoring
- ⚠️ **Exception Handling** - Custom error classes and centralized error handling
- 🛡️ **Guards & Policies** - Role-based access control (RBAC)

### Phase 3: Enterprise Features
- 💉 **Dependency Injection** - Container-based DI system
- 📦 **Module System** - Modular project architecture
- ⌨️ **CLI Commands** - Custom CLI commands (`cache:clear`, `queue:work`, etc.)
- ⚙️ **Config System** - Centralized configuration management
- 🔢 **API Versioning** - Version management for your API
- 📝 **Structured Logging** - Multi-channel logging with Winston

## Generated Project Structure

```
my-project/
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

