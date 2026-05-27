# Supabase Setup

This app uses Supabase as a managed PostgreSQL database. The frontend still talks to the Spring Boot API; it does not need Supabase keys unless you later add Supabase Auth or Storage.

## 1. Create the Supabase project

1. Create a new Supabase project.
2. Go to Project Settings > Database.
3. Copy the Transaction pooler connection details.
4. Use port `6543`, database `postgres`, and SSL mode `require`.

For this Spring Boot app, the JDBC URL should look like:

```properties
DATABASE_URL=jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
DATABASE_USERNAME=postgres.your-project-ref
DATABASE_PASSWORD=your-database-password
```

Use your actual pooler host, project ref, and password from Supabase.

## 2. Configure the backend

Create `backend/.env.local` from the example:

```bash
cd backend
cp .env.example .env.local
```

Edit `backend/.env.local`:

```properties
DATABASE_URL=jdbc:postgresql://your-pooler-host.supabase.com:6543/postgres?sslmode=require
DATABASE_USERNAME=postgres.your-project-ref
DATABASE_PASSWORD=your-supabase-database-password
DATABASE_MAX_POOL_SIZE=5
DATABASE_MIN_IDLE=1
JPA_DDL_AUTO=update

JWT_SECRET=replace-with-at-least-32-random-characters
APP_FRONTEND_BASE_URL=http://localhost:5173
APP_BACKEND_BASE_URL=http://localhost:8080
APP_SEED_TMDB_ENABLED=false
```

Keep `JPA_DDL_AUTO=update` for local development so Hibernate can create/update the schema in Supabase. For a production deployment, change it to `validate` after the schema is stable and manage schema changes through migrations.

## 3. Configure the frontend

Create `frontend/.env`:

```bash
cd frontend
cp .env.example .env
```

For local development:

```properties
VITE_API_BASE_URL=http://localhost:8080/api
```

## 4. Run the app

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## 5. Useful Supabase checks

After the backend starts, open Supabase Table Editor. You should see tables such as `app_users`, `movies`, `cinemas`, `rooms`, `seats`, `showtimes`, `bookings`, and `tickets`.

If startup fails with authentication or connection errors, re-check:

- The URL is the transaction pooler JDBC URL, not the REST API URL.
- The username includes the project ref, for example `postgres.your-project-ref`.
- The URL includes `?sslmode=require`.
- The database password is the database password, not the anon key or service-role key.
- Your Supabase project is active and not paused.

## 6. Security note

Do not commit `backend/.env.local`, `backend/.env`, `frontend/.env`, or Supabase passwords. If a real database password was committed before, rotate it in Supabase before sharing the repository.
