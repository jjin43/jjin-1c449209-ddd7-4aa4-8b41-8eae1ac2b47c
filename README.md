# TurboVet Full-Stack Assessment
- **Justin Jin / justinjinaz@gmail.com**

## Table of Contents
  - [Setup Instructions](#setup-instructions)
  - [Architecture Overview](#architecture-overview)
  - [Data Model Explanation](#data-model-explanation)
  - [Access Control Implementation](#access-control-implementation)
  - [API Documentation](#api-documentation)
  - [Future Considerations](#future-considerations)

## Setup Instructions

- **Prerequisites:** Node.js 18+ (or compatible), npm (or yarn), and Git.

```bash
# Install dependencies (at root directory)
npm install

# JS script for seeding the database with users
npm run seed

# Start backend API
npx nx serve api

# Start frontend dashboard
npx nx serve dashboard
```

- **.env**

Create an `.env` file under `apps/api` (or provide these vars to your environment).

```
# apps/api/.env
DB_TYPE=sqlite
DB_PATH=apps/api/db.sqlite
JWT_SECRET=dev_secret
JWT_EXPIRES_IN=3000s
```

- **Tests using Jest:**

```bash
npm test
```

## Architecture Overview

- **Backend — `apps/api`**
  - `apps/api/src/main.ts` — application bootstrap.
  - `apps/api/src/app/app.module.ts` — root module wiring submodules.
  - `apps/api/src/app/*`
    - `auth/` — authentication controllers, strategies, guards, and DTOs.
    - `audit/` — audit controller/service for change logging.
    - `tasks/` — tasks controller, service, DTOs.
    - `organization/` — organization service and helpers.
    - `users/` — user-related modules and services.
    - `entities/` — TypeORM entity definitions.
  - `apps/api/src/scripts/seed.ts` — database seeding utility.
  - `apps/api/tests/` — unit tests for services/controllers (Jest).

- **Frontend — `apps/dashboard`**
  - `apps/dashboard/src/main.ts` — frontend bootstrap.
  - `apps/dashboard/src/app/`
    - `routes/` — route definitions and navigation.
    - `components/` — UI components and html pages.
    - `services/` — client-side services for API calls and auth handling.
    - `guards/` and `interceptors/` — route guards and HTTP interceptors.
    - `models/` — client-side models/types that interfaces backend entities.
  - `apps/dashboard/src/styles.css` / `public/` — static assets and global styles.
  - Frontend unit tests unfinished.

- **Shared Library**
  - `libs/*` — small libraries (auth helpers, shared types, enums) consumed by both apps.


## Data Model Explanation

![ERD diagram](erd.png)

Schema:

- **Organization**
  - `id` (uuid, PK)
  - `name` (string, unique)
  - `parentId` (uuid | null, FK -> Organization.id)
  - Relations: `parent` (ManyToOne), `children` (OneToMany)
  - Note: service enforces a 2-level hierarchy (no grandchildren).

- **User**
  - `id` (uuid, PK)
  - `email` (string, unique)
  - `passwordHash` (string)
  - `role` (enum: OWNER | ADMIN | VIEWER)
  - `organizationId` (uuid, FK -> Organization.id)
  - Relation: `organization` (ManyToOne)
  - `createdAt` (datetime)

- **Task**
  - `id` (uuid, PK)
  - `title` (string)
  - `description` (text | null)
  - `status` (enum: TODO | IN_PROGRESS | DONE)
  - `category` (string)
  - `role` (enum: target role for task)
  - `organizationId` (uuid, FK -> Organization.id)
  - Relation: `organization` (ManyToOne)
  - `createdById` (uuid, FK -> User.id)
  - Relation: `createdBy` (ManyToOne)
  - `createdAt`, `updatedAt` (datetime)

- **Permission**
  - `id` (uuid, PK)
  - `taskId` (uuid, FK -> Task.id)
  - Relation: `task` (ManyToOne)
  - `userId` (uuid, FK -> User.id)
  - Relation: `user` (ManyToOne)
  - `canEdit` (boolean)
  - `canDelete` (boolean)
  - `createdAt` (datetime)


## Access Control Implementation

This project combines organization-scoped RBAC with explicit per-resource permissions. Authorization is enforced in a layered, auditable way so policy decisions are consistent and testable.

- **Roles & scope**
  - Roles: `OWNER`, `ADMIN`, `VIEWER` (see `libs/data/src/lib/role.enum.ts`). Roles are scoped to an `organizationId` stored on the `User` entity.
  - Roles are  ranked (OWNER > ADMIN > VIEWER), `RolesGuard` enforces a minimum-role requirement by comparing ranks.
  - Only `/audit-log` requires ADMIN+ privilege, VIEWER+ required for basic tasks operations.
  - List and query endpoints (for example `GET /tasks`) filter results to the requester's organization.

- **Per-task permissions**
  - `Permission` records ( `canEdit`, `canDelete`) checks user privileges on a task. Contains the creator by default, users with edit permission can further grant permissions.

- **Authentication and global guard**
  - The API issues JWTs on login containing `sub`, `email`, `role`, and `organizationId`. The login endpoint sets the JWT as an HttpOnly cookie named `jid` (also supported via `Authorization: Bearer <token>` for testing/non-browser clients).
  - `JwtAuthGuard` is registered globally (`APP_GUARD`), so routes are protected by default; controllers can opt out using `@Public()`.
  - The frontend does not persist JWTs in JS-accessible storage; it keeps minimal auth state (`AuthService.currentUser$`) in memory and calls `GET /auth/me` on startup to populate the UI.

## API Documentation

- **Base**
  - `GET /` — health / basic info. Public.

- **Auth** (`/auth`)
  - `POST /auth/login` — login with `{ email, password }`. Public.
    - Response: sets HttpOnly `jid` cookie and returns user info:
    ```json
    { "id": "u1", "email": "admin@example.com", "role": "ADMIN", "organizationId": "org1" }
    ```
  - `POST /auth/logout` — clears `jid` cookie. Public.
  - `GET /auth/me` — returns current user from JWT (requires auth).

- **Tasks** (`/tasks`) — requires `VIEWER+`
  - `GET /tasks` — list tasks for the authenticated user's organization and role.
  - `GET /tasks/:id` — get a single task.
  - `POST /tasks` — create a task (body: `title`, optional `description`, `category`, `role`). Requires `VIEWER`+.
    - Example request body:
    ```json
    { "title": "Sample Task", "description": "This is a sample task", "category": "Work", "role": "VIEWER", "permission": "[{'email': 'bob@example.com', 'canEdit': True, 'canDelete': True}, ...]" }
    ```
  - `PUT /tasks/:id` — update task fields.
  - `DELETE /tasks/:id` — delete task.

- **Audit** (`/audit-log`) — requires `ADMIN+`
  - `GET /audit-log` — list audit events for the user's organization.

Notes
- All non-public endpoints expect authentication via cookie (`jid`) or `Authorization: Bearer <token>`.
- Uses APP_GUARD to apply global JWT guard, except for public ones.
- Request/response DTOs live under each module's `dto/` directory (e.g. `apps/api/src/app/tasks/dto`).
- Error responses use standard HTTP status codes.


## Future Considerations

Below are some discussions and plans for implementing the future considerations.

- **Advanced role delegation**
  - Allow a user to delegate a subset of their role to another user temporarily.
  - General Plan:
    1. Add a `Delegation` table: { id, delegatorUserId, delegateeUserId, role, expiresAt, scopes }.
    2. Resolve effective roles at request time by merging permanent role + active delegations for the user; cache results briefly.
    3. Add API and admin UI to create/revoke delegations; validate `expiresAt` and scopes server-side.


- **JWT refresh tokens**
  - Long-lived sessions via single JWT are risky; refresh tokens allow short-lived access tokens and safer rotation.
  - General Plan:
    1. Issue short-lived access tokens (e.g., 5–15 minutes) and long-lived refresh tokens (HttpOnly cookie).
    2. Store refresh tokens server-side (DB or Redis) with lifespan and a rotating token pattern (storing token hash).
    3. Implement auth API endpoint to exchange refresh for new access (+ rotated refresh token). Invalidate previous refresh.
    4. Add logout/invalidate endpoint to revoke refresh tokens.
    5. Security: store only hashed refresh tokens, support token revocation list, and require TLS + `secure` cookies.

- **CSRF protection**
  - HttpOnly cookies are vulnerable to cross-site request forgery for state-changing endpoints.
  - 2 common methods:
    - Server issues a CSRF token (accessible to frontend) stored in a non-HttpOnly cookie and submitted in header, server verifies matching.
    - SameSite + Origin checks: use `SameSite=Lax/Strict` and verify origin on write endpoints.

- **RBAC caching / Permission check scaling**
  - Permission checks can cause many DB reads per request; caching reduces latency and DB load.
  - Plan:
    1. Cache common lookups: `user->roles`, `user->org`, `user->permission:[taskId]` using Redis with short lifespan (session duration).
    2. Invalidate/evict cache when permissions, roles, or related resources change.
    3. Batch permission queries where possible, fetch permissions for a page of tasks in one query rather than per-task queries.
