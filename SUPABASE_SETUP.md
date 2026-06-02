# Supabase Setup

This app uses **Supabase as managed PostgreSQL**. The React frontend talks only to the **Spring Boot API**—it does not need Supabase API keys unless you later add Supabase Auth or Storage.

**Schema management:** Flyway applies SQL migrations on backend startup. Hibernate uses `JPA_DDL_AUTO=validate` (it does not create tables). See [README.md](./README.md#supabase-and-flyway) for details.

---

## 1. Create the Supabase project

1. Create a new project at [supabase.com](https://supabase.com).
2. Open **Project Settings → Database**.
3. Under **Connection string**, choose **Transaction pooler** (or **Session pooler** for the first migration—see below).
4. Use database `postgres`, port **`6543`** (pooler) or **`5432`** (session/direct), and **`sslmode=require`**.

Example JDBC values for the **transaction pooler** (normal app runtime):

```properties
DATABASE_URL=jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
DATABASE_USERNAME=postgres.your-project-ref
DATABASE_PASSWORD=your-database-password
```

Replace host, project ref, and password with your project’s values.

### First-time migration tip

On a **new empty** database, if the backend fails during Flyway with locking or pooler errors:

1. Temporarily switch `DATABASE_URL` to the **session/direct** host (port `5432`, same user/password).
2. Start the backend once so Flyway runs `V1` through `V16` and creates `flyway_schema_history`.
3. Switch back to the transaction pooler URL (`6543`) for day-to-day development.

`spring.flyway.postgresql.transactional-lock=false` is already set in `application.properties` for PgBouncer/Supabase compatibility.

---

## 2. Configure the backend

```bash
cd backend
cp .env.example .env.local
```

Edit `backend/.env.local` (minimum):

```properties
DATABASE_URL=jdbc:postgresql://your-pooler-host.supabase.com:6543/postgres?sslmode=require
DATABASE_USERNAME=postgres.your-project-ref
DATABASE_PASSWORD=your-supabase-database-password
DATABASE_MAX_POOL_SIZE=5
DATABASE_MIN_IDLE=1

# Flyway creates/updates tables; Hibernate only checks they match entities.
JPA_DDL_AUTO=validate
FLYWAY_ENABLED=true
FLYWAY_BASELINE_ON_MIGRATE=false

JWT_SECRET=replace-with-at-least-32-random-characters
JWT_EXPIRATION_MS=86400000

APP_BACKEND_BASE_URL=http://localhost:8080
APP_FRONTEND_BASE_URL=http://localhost:5173

# Optional
TMDB_API_READ_ACCESS_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APP_SEED_TMDB_ENABLED=false
APP_SEED_DUMMY_USERS_ENABLED=false

PAYMENT_VNPAY_ENABLED=false
PAYMENT_VNPAY_PAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
PAYMENT_VNPAY_TMN_CODE=
PAYMENT_VNPAY_HASH_SECRET=
```

Do **not** use `JPA_DDL_AUTO=update` with this project—the canonical schema lives in `backend/src/main/resources/db/migration/`.

**Legacy database** (tables existed before Flyway): set `FLYWAY_BASELINE_ON_MIGRATE=true` and `FLYWAY_BASELINE_VERSION=12` once, start the app, then remove those flags. See README.

**Production:** set `SPRING_PROFILES_ACTIVE=prod` on the host (disables demo seeding; see `application-prod.properties`).

Enable `PAYMENT_VNPAY_ENABLED=true` only after sandbox credentials are set. For gateway callbacks from the internet, point `APP_BACKEND_BASE_URL` at a public URL (e.g. ngrok tunnel to port 8080).

---

## 3. Configure the frontend

```bash
cd frontend
cp .env.example .env
```

```properties
VITE_API_BASE_URL=http://localhost:8080/api
```

Google OAuth (optional): add `http://localhost:8080/login/oauth2/code/google` as an authorized redirect URI in Google Cloud Console.

---

## 4. Run the app

Backend (applies Flyway migrations on startup):

```bash
cd backend
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` (API: `http://localhost:8080`).

Optional: run migrations without starting the app:

```bash
export DATABASE_URL='jdbc:postgresql://...'
export DATABASE_USERNAME='postgres.your-project-ref'
export DATABASE_PASSWORD='...'
./scripts/migrate-db.sh
```

---

## 5. Verify in Supabase

After a successful backend start:

1. Open **Table Editor** in the Supabase dashboard.
2. Confirm tables exist, for example: `users`, `movies`, `cinemas`, `rooms`, `seats`, `showtimes`, `bookings`, `tickets`, `food_items`, `notifications`, `flyway_schema_history`.
3. Check **Database → Migrations** is not required for this app—Flyway history is in `flyway_schema_history`.

If startup fails, re-check:

| Check | Detail |
|--------|--------|
| URL type | JDBC Postgres URL, not the Supabase REST or anon URL |
| Username | Includes project ref, e.g. `postgres.abcdef123456` |
| Password | Database password from Supabase, not anon/service_role JWT |
| SSL | `?sslmode=require` on the JDBC URL |
| Project state | Project is not paused |
| Pooler | Try session URL (`5432`) for first Flyway run |

### `prepared statement "S_..." does not exist`

The transaction pooler (PgBouncer) can break server-side prepared statements. This project sets:

```properties
spring.datasource.hikari.data-source-properties.prepareThreshold=0
```

in `application.properties`—keep it enabled when using Supabase pooler.

### Hibernate validation failed after pull

Your database schema is behind the code. Ensure `FLYWAY_ENABLED=true`, restart the backend, or run `./scripts/migrate-db.sh` against the same database.

---

## 6. Security

- Do not commit `backend/.env.local`, `backend/.env`, or `frontend/.env`.
- Do not put Supabase passwords or JWT secrets in Git.
- If a password was ever committed, **rotate** it in Supabase → Database settings before sharing the repo.

For full API, routes, and feature list, see [README.md](./README.md).
