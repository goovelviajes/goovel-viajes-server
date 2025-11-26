# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development commands

All commands are intended to be run from the project root.

- Install dependencies:
  - `npm install`
- Start development server (watches for changes, uses `.env.${NODE_ENV || 'development'}`):
  - `npm run start:dev`
- Build the project (outputs to `dist/`):
  - `npm run build`
- Start in production mode (expects compiled `dist/` and appropriate `.env.production`):
  - `npm run start:prod`
- Run unit tests (Jest, `*.spec.ts` under `src/`):
  - `npm test`
- Run unit tests in watch mode:
  - `npm run test:watch`
- Run unit tests with coverage:
  - `npm run test:cov`
- Lint the codebase (ESLint + TypeScript + Prettier integration):
  - `npm run lint`
- Format TypeScript sources with Prettier:
  - `npm run format`

### Running a single test

Jest tests are colocated with the code under `src/**`. To run a specific test file, pass its path to the Jest runner via the `test` script, for example:

- `npm test -- src/user/user.service.spec.ts`

> Note: There is an `npm run test:e2e` script configured to use `test/jest-e2e.json`, but that config file is not currently present in the repository. Create it before relying on the e2e script.

## Environment & configuration

- Environment variables are documented in `.env.example`.
- Configuration is loaded via `@nestjs/config` in `AppModule`:
  - `ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env." + (process.env.NODE_ENV || "development") })`
  - In local development, a typical setup is to create `.env.development` based on `.env.example`.
- Key variables (see `.env.example` and `README.md`):
  - `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DB_SYNCHRONIZE`
  - `PORT` (application listen port)
  - `GOOGLE_CLIENT_ID` (currently only used in commented-out Google login code)
  - `SECRET_KEY` (JWT signing)
  - `FRONTEND_URL` (CORS origin allowed by the API)
- The HTTP server is configured in `src/main.ts`:
  - CORS is enabled with `origin: process.env.FRONTEND_URL`, limited HTTP methods, and credentials support.
  - Global validation is enabled via `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform`.
  - A global `ClassSerializerInterceptor` is registered.
  - The app listens on `process.env.PORT || 3050`.

## API documentation (Swagger)

- Swagger is configured in `src/main.ts` using `@nestjs/swagger`.
- The documentation is served at the `/api` path on the running server.
- A bearer auth scheme named `access-token` is registered and is referenced throughout the controllers via `@ApiBearerAuth('access-token')`.

## High-level architecture

### NestJS application bootstrap

- `src/main.ts` bootstraps a standard NestJS HTTP application with global validation, serialization, CORS, and Swagger.
- `src/app.module.ts` is the root module. It:
  - Loads configuration from environment-specific `.env.*` files.
  - Configures a MySQL connection via `TypeOrmModule.forRoot`, with:
    - `entities` resolved from `dist` (or `src` in dev) via `join(__dirname, '/**/*.entity{.js,.ts}')`.
    - `synchronize: true` (automatic schema synchronization; consider this when making schema changes).
  - Imports the domain modules: `AuthModule`, `UserModule`, `ProfileModule`, `VehicleModule`, `NotificationModule`, `ReportModule`, `MessageModule`, `RatingModule`, `JourneyModule`, `BookingModule`, and `JourneyRequestModule`.

### Persistence layer & entities

- TypeORM is used as the ORM with MySQL as the backing database.
- Each domain module typically has an `entities/` directory with its aggregate root entity.
- The `User` entity (`src/user/entities/user.entity.ts`) is central and models relationships to most other entities:
  - One-to-one with `Profile`.
  - One-to-many with `Notification`, `Report`, `Vehicle`, sent and received `Message`s, `Journey`, `Booking`, `Rating` (both as rater and rated user), and `JourneyRequest`.
- Other notable entities:
  - `Vehicle` (user-owned vehicles used to publish journeys).
  - `Journey` (published trips, including origin/destination, departure time, and status).
  - `Booking` (passenger bookings for journeys).
  - `JourneyRequest` (requests to join journeys or send packages, with a type enum).
  - `Message`, `Notification`, `Rating`, and `Report` implement supporting features around communication, feedback, and abuse reporting.

These relationships mean that user-centric operations often cascade through multiple modules (e.g., deleting a user impacts associated vehicles, journeys, bookings, etc.); take care to understand the entity graph before making changes to deletion or cascade behavior.

### Domain modules & responsibilities

Each top-level directory under `src/` is a NestJS module encapsulating a domain. Common structure within a module:

- `*.module.ts` – NestJS module wiring (imports `TypeOrmModule.forFeature([...])`, other modules, and declares controllers/services).
- `*.controller.ts` – HTTP API endpoints, decorated with Swagger metadata and usually guarded by JWT auth where needed.
- `*.service.ts` – Business logic and persistence operations using injected repositories and other services.
- `dto/` – Data Transfer Objects used for request validation and response shaping.
- `entities/` – TypeORM entities for the domain model.
- `enums/`, `decorators/`, etc. – Module-specific support code.

Key modules:

- **Auth (`src/auth/`)**
  - Handles user registration and login with email/password.
  - Uses `bcryptjs` for password hashing and `@nestjs/jwt` for token generation.
  - Depends on `UserService` and `ProfileService` to create users and associated profiles.
  - JWT configuration (`secret`, expiry) is centralized in `AuthModule` using environment variables.
  - Custom guards live under `src/auth/guard/` (e.g., `TokenGuard`, `RoleGuard`) and are used across controllers to enforce authentication/authorization.

- **User (`src/user/`)**
  - Manages core user records using a TypeORM `Repository<User>`.
  - Provides operations such as creation, fetching by email/ID, updating profile information (with validation on birthdate), and soft deletion/restoration.
  - Exposes endpoints like `PATCH /user` (update active user) and `DELETE /user/me` (soft delete active user), consuming the active user from request context via `ActiveUser`.

- **Profile (`src/profile/`)**
  - Stores user profile details linked one-to-one with `User`.
  - Generates unique profile names via `lib/generate-username.ts`, which `AuthService` uses during registration.

- **Vehicle (`src/vehicle/`)**
  - Models vehicles owned by users; each vehicle is associated with a `User`.
  - Provides decorators and DTOs for validating vehicle input (e.g., plate format through `is-plate.decorator.ts`).
  - Used heavily by `JourneyService` when creating journeys.

- **Journey (`src/journey/`)**
  - Represents published trips and uses `JourneyStatus` / `JourneyType` enums for state and classification.
  - Depends on `VehicleService` and `User` relationships to ensure:
    - Journeys belong to the active user.
    - Only the owner of a vehicle can publish journeys with that vehicle.
    - Departure times are in the future and no duplicated journeys exist for the same vehicle/day.
  - Exposes endpoints to create journeys, cancel them, list pending journeys, and retrieve the active user’s own journeys.

- **Booking (`src/booking/`)** and **Journey Request (`src/journey-request/`)**
  - Implement the interaction layer between passengers (or package senders) and journeys.
  - Use enums to track request/booking status and type, and rely on `Journey` and `User` entity relations for authorization and data fetching.

- **Message (`src/message/`), Notification (`src/notification/`), Rating (`src/rating/`), Report (`src/report/`)**
  - Provide supporting capabilities: user-to-user messaging, notifications, rating users after trips, and reporting issues.
  - Each follows the same module pattern (entity, service, controller, specs) and links back to `User`.

- **Common (`src/common/`)**
  - `decorator/` – cross-cutting decorators such as:
    - `active-user.decorator.ts`: extracts the authenticated `user` from the request and is widely used in controllers.
    - Validation decorators like `is-adult`, `is-future-date`, `is-diferent-location`, etc., used in DTOs to enforce domain-specific invariants.
  - `dtos/` – shared DTOs, e.g., reusable `location` structures.
  - `interface/` – shared interfaces like `ActiveUserInterface` used throughout the auth/user/journey flows.
  - `utils/` – shared utilities, such as date helpers.

## Testing layout

- Jest is configured in `package.json` with `rootDir: "src"` and `testRegex: ".*\\.spec\\.ts$"`.
- Unit tests are colocated with implementation files under each module directory (e.g., `src/user/user.service.spec.ts`, `src/journey/journey.controller.spec.ts`).
- Use `npm test` or `npm run test:watch` for local TDD workflows, and `npm run test:cov` to ensure coverage, especially when modifying service-level business logic.

## Linting & formatting

- ESLint configuration lives in `.eslintrc.js` and is wired for TypeScript:
  - Uses `@typescript-eslint/parser` with `tsconfig.json`.
  - Extends `plugin:@typescript-eslint/recommended` and `plugin:prettier/recommended`.
  - Custom rules relax some strict TypeScript style constraints (e.g., explicit return types, `any` usage).
- Prettier configuration is in `.prettierrc` and enforces:
  - Single quotes.
  - Trailing commas (`"trailingComma": "all"`).
- Before submitting non-trivial changes, run `npm run lint` and `npm run format` to keep the codebase consistent with existing style and tooling.
