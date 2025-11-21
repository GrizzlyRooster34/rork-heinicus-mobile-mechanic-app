# Project Structure

This document provides an overview of the project's structure, including the directory layout and key files.

## Project Tree

```
.
├── __tests__/         # Unit, integration, and E2E tests
├── .expo/             # Expo-related cache and configuration
├── .git/              # Git version control directory
├── .github/           # GitHub-related files (e.g., workflows)
├── android/           # Android native project
├── app/               # Expo Router-based application code (screens)
├── assets/            # Static assets like images and fonts
├── backend/           # Hono, tRPC, and Prisma backend code
├── components/        # Reusable React Native components
├── constants/         # Application constants (colors, styles, etc.)
├── coverage/          # Test coverage reports
├── docs/              # Project documentation
├── hooks/             # Custom React hooks
├── ios/               # iOS native project
├── lib/               # Library code (Prisma client, tRPC client, etc.)
├── node_modules/      # Project dependencies
├── prisma/            # Prisma schema and migration files
├── scripts/           # Utility scripts (e.g., bump version)
├── services/          # Services for interacting with APIs
├── stores/            # Zustand stores for state management
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── .env.example       # Example environment variables
├── .eslintrc.js       # ESLint configuration
├── app.json           # Expo app configuration
├── babel.config.js    # Babel configuration
├── jest.config.js     # Jest test runner configuration
├── metro.config.js    # Metro bundler configuration
├── package.json       # Project dependencies and scripts
├── tailwind.config.js # Tailwind CSS configuration
└── tsconfig.json      # TypeScript configuration
```

## Key Files

*   `package.json`: Defines the project's dependencies, scripts, and metadata. It's the central configuration file for the Node.js environment.
*   `app.json`: The main configuration file for the Expo app, defining properties like the app name, version, icon, and splash screen.
*   `babel.config.js`: Configures Babel for transpiling JavaScript and TypeScript code.
*   `metro.config.js`: The configuration file for the Metro bundler, used by React Native.
*   `tailwind.config.js`: Configures Tailwind CSS for use with Nativewind.
*   `jest.config.js`: The configuration file for the Jest test runner, defining the test environment, coverage thresholds, and more.
*   `prisma/schema.prisma`: Defines the database schema, models, and relations for the application.
*   `backend/hono.ts`: The entry point for the Hono backend server, where the tRPC router and other middleware are mounted.
*   `backend/trpc/app-router.ts`: The main tRPC router, which combines all the individual API routers for the application.
