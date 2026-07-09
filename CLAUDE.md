# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — install dependencies
- `npm run start:dev` — run in watch mode (most common during development), serves on `PORT` from `.env` (default 3000)
- `npm run start` / `npm run start:prod` — run without watch / run compiled `dist/main`
- `npm run build` — `nest build`
- `npm run lint` — `eslint --fix` over `src`, `apps`, `libs`, `test`
- `npm run test` / `npm run test:watch` / `npm run test:cov` — unit tests (Jest, rootDir `src`, matches `*.spec.ts`)
- Run a single test file: `npx jest path/to/file.spec.ts`
- `npm run test:e2e` — e2e tests, separate config at `test/jest-e2e.json`, matches `*.e2e-spec.ts`

`.env` / `.env.example` hold `MONGODB_URI` and `PORT`, loaded globally via `@nestjs/config` (`ConfigModule.forRoot({ isGlobal: true })` in `src/app.module.ts`).

## Architecture

**Module-per-resource layout.** Each feature lives under `src/<feature>/` with a consistent shape: `schemas/` (Mongoose schema), `dto/` (`create-*.dto.ts` with `class-validator` decorators, `update-*.dto.ts` as `PartialType(Create...Dto)`), `<feature>.service.ts`, `<feature>.controller.ts`, `<feature>.module.ts`. See `src/users/` and `src/orders/` as the reference implementations for this pattern.

**MongoDB wiring.** `@nestjs/mongoose` connects via `MongooseModule.forRootAsync` in `app.module.ts`, reading `MONGODB_URI` through `ConfigService`. Each feature module registers its schema with `MongooseModule.forFeature(...)`.

**Validation.** A global `ValidationPipe({ whitelist: true, transform: true })` is registered in `src/main.ts`, so every DTO's `class-validator` decorators are enforced automatically on incoming requests.

**Cross-module dependency example.** `OrdersModule` imports `UsersModule` and injects `UsersService` into `OrdersService` to verify `Order.userId` references an existing user before create/update (`src/orders/orders.service.ts`). `UsersModule` exports `UsersService` specifically to support this. This is the pattern to follow when one resource needs to validate against another; `OrderItemsModule` repeats it with `OrdersModule`/`OrdersService`.

**Derived totals.** `Order.totalPrice` is not set directly by clients in normal use — it's kept in sync by `OrderItemsService` (`src/order-items/order-items.service.ts`), which recalculates `sum(quantity * price)` across all `OrderItem`s for an order and writes it via `OrdersService.update()` after every order-item create/update/delete (including recalculating the *previous* order's total if an item's `orderId` is changed on update).

**Password handling.** `User.password` is declared `select: false` on the schema so it's excluded from normal query results, and is hashed via Mongoose `pre('save')` / `pre('findOneAndUpdate')` hooks in `src/users/schemas/user.schema.ts`. `UsersService.create()` additionally strips `password` from its return value manually, since `.create()` bypasses field selection and would otherwise leak the hash.

**Mongoose 9 async hook gotcha.** The installed Mongoose version (9.x) does not pass a `next` callback into `async` pre-hooks — hooks must be plain `async function`s that return/throw normally. Calling `next()` inside an async hook throws `next is not a function` at runtime.
