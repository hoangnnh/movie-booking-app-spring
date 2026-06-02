# Movie Booking App Spring

A full-stack movie ticket booking web application for a university Java project (Class name: IE303.Q21.CNVN). Users can browse movies, view details, pick showtimes and seats, add concessions, pay (sandbox gateways), and manage bookings and profile.

Built with **Spring Boot**, **React (Vite)**, **PostgreSQL** (typically **Supabase**), **Flyway** migrations, and **TMDB** for catalog data.

---

## Quick start

1. **Database** — Create a Supabase project (or any PostgreSQL). See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).
2. **Backend** — `cp backend/.env.example backend/.env.local`, fill in `DATABASE_*`, `JWT_SECRET`, and optional TMDB/email keys, then:

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

   Flyway applies migrations on startup (`FLYWAY_ENABLED=true`). Hibernate only **validates** the schema (`JPA_DDL_AUTO=validate`).

3. **Frontend** — `cp frontend/.env.example frontend/.env`, set `VITE_API_BASE_URL=http://localhost:8080/api`, then:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open `http://localhost:5173` (API at `http://localhost:8080`).

Do not commit `backend/.env.local` or `frontend/.env`.

---

## Features

### Implemented

- JWT authentication and protected routes
- Google OAuth login
- Email verification, forgot password, and reset password
- Movie catalog (showing now / coming soon), search, autocomplete, slug URLs
- Movie detail, cast, showtimes, age rating display
- Seat selection, booking lifecycle, and expiry for unpaid bookings
- Food and drink (concessions) in checkout
- VNPay payment integration (sandbox, feature-flagged)
- User profile, avatar, password change
- In-app notifications for bookings and password changes
- My bookings and booking detail
- Movie recommendations
- Admin dashboard (movies, users, bookings) and TMDB import
- TMDB sync / backfill jobs (optional, env-controlled)
- Dark/light theme toggle

### Planned / future

- Production payment go-live and webhooks hardening
- Email/SMS notification channels beyond current in-app and auth emails
- Mobile-first layout polish
- Further recommendation tuning

---

## Tech stack

| Layer | Technologies |
|--------|----------------|
| Backend | Java 21, Spring Boot, Spring Security, Spring Data JPA, Flyway, Lombok, Maven |
| Frontend | React 19, Vite, Tailwind CSS, React Router, Lucide React |
| Database | PostgreSQL (Supabase) |
| Integrations | TMDB API, SMTP (Gmail), VNPay, Google OAuth |

---

## Supabase and Flyway

**Supabase** is hosted PostgreSQL. **Flyway** is how this app creates and updates tables—it is not replaced by Supabase.

| Concern | Tool |
|---------|------|
| Where data lives | Supabase (or any Postgres) via `DATABASE_URL` |
| Schema versions | SQL files in `backend/src/main/resources/db/migration/` (`V1` … `V16`) |
| When migrations run | Backend startup (or `./scripts/migrate-db.sh` before deploy) |
| Entity ↔ table match | Hibernate `ddl-auto=validate` (no auto `update` in prod) |

**Supabase connection tips**

- **App runtime:** transaction pooler URL (port `6543`) with `?sslmode=require` is fine.
- **First migration on a new project:** if Flyway fails on locking, use the **session/direct** URL (port `5432`) once, then switch back to the pooler.
- `spring.flyway.postgresql.transactional-lock=false` is set for PgBouncer/Supabase pooler compatibility.

**Adding a schema change**

1. Add `backend/src/main/resources/db/migration/V17__your_change.sql` (next version after `V16`).
2. Update JPA entities and DTOs to match.
3. Run `./mvnw test` in `backend/`. `FlywayMigrationIntegrationTest` runs when Docker is available (skipped otherwise).

**Legacy databases** created before Flyway: set `FLYWAY_BASELINE_ON_MIGRATE=true` and `FLYWAY_BASELINE_VERSION=12` once, start the app, then remove those flags.

**Optional migrate-before-deploy**

```bash
export DATABASE_URL='jdbc:postgresql://host:5432/postgres?sslmode=require'
export DATABASE_USERNAME='postgres'
export DATABASE_PASSWORD='secret'
chmod +x scripts/migrate-db.sh
./scripts/migrate-db.sh
```

**Production profile** — `SPRING_PROFILES_ACTIVE=prod` uses `application-prod.properties` (Flyway on, demo seeding off).

---

## Project structure

```text
movie-booking-app-spring/
├── backend/
│   ├── src/main/java/com/cinemabooking/
│   │   ├── ai/              # recommendation engine
│   │   ├── config/          # security, seeders, Flyway helpers
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── security/
│   │   └── service/
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── application-prod.properties
│   │   └── db/migration/    # Flyway SQL (V1–V16)
│   ├── src/test/
│   ├── .env.example
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── scripts/
│   └── migrate-db.sh
├── SUPABASE_SETUP.md
└── README.md
```

---

## Prerequisites

- Java 21
- Node.js and npm
- Git
- A PostgreSQL database (Supabase account is enough; no local Postgres or Docker required)
- Optional: Docker — only for `FlywayMigrationIntegrationTest` (Testcontainers)

---

## Backend setup

```bash
cd backend
cp .env.example .env.local
```

Edit `backend/.env.local`. Minimum for Supabase:

```env
DATABASE_URL=jdbc:postgresql://your-pooler-host.supabase.com:6543/postgres?sslmode=require
DATABASE_USERNAME=postgres.your-project-ref
DATABASE_PASSWORD=your-supabase-database-password
DATABASE_MAX_POOL_SIZE=5
DATABASE_MIN_IDLE=1

JPA_DDL_AUTO=validate
FLYWAY_ENABLED=true
FLYWAY_BASELINE_ON_MIGRATE=false

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRATION_MS=86400000

APP_BACKEND_BASE_URL=http://localhost:8080
APP_FRONTEND_BASE_URL=http://localhost:5173

TMDB_API_READ_ACCESS_TOKEN=your_tmdb_read_access_token
```

Optional (see `backend/.env.example` for full list): Google OAuth, SMTP email, VNPay, TMDB sync/backfill flags, dummy user seeding (`APP_SEED_DUMMY_USERS_*`).

Run:

```bash
./mvnw spring-boot:run
```

API base: `http://localhost:8080` — e.g. `GET http://localhost:8080/api/movies`.

Configuration is loaded from `backend/.env.local` (or repo-root `.env.local`) via `spring.config.import` in `application.properties`. Tracked defaults live in `backend/src/main/resources/application.properties`.

For deployed email (verification / reset), configure SMTP (`EMAIL`, `EMAIL_PASSWORD`, `APP_EMAIL_FROM`). Use a Google **app password**, not your account password.

For payment sandbox callbacks, set `APP_BACKEND_BASE_URL` to a public URL (e.g. ngrok) when testing gateways locally.

---

## Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
```

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Google OAuth: add `http://localhost:8080/login/oauth2/code/google` as an authorized redirect URI in Google Cloud Console.

```bash
npm run dev
```

App: `http://localhost:5173`

---

## Main API endpoints

Prefix: `/api` unless noted.

### Auth — `/api/auth`

```http
POST   /register
POST   /login
GET    /me
GET    /profile
PATCH  /profile
PATCH  /profile/avatar
PATCH  /password
GET    /verify-email?token=...
POST   /resend-verification
POST   /forgot-password
POST   /reset-password
GET    /settings
```

OAuth: `GET /oauth2/authorization/google` (Spring Security).

### Movies — `/api/movies`

```http
GET    /
GET    /now-playing
GET    /coming-soon
GET    /trending/week
GET    /autocomplete?q=...
GET    /by-actor?name=...
GET    /{reference}          # id or slug
GET    /{id}/similar
```

### Showtimes & seats — `/api`

```http
GET    /movies/{movieId}/showtimes
GET    /showtimes/{showtimeId}
GET    /showtimes/{showtimeId}/seats
GET    /showtimes/{showtimeId}/food-items
```

### Bookings — `/api`

```http
POST   /bookings
GET    /users/{userId}/bookings
```

### Users — `/api/users/{userId}`

```http
GET/POST/DELETE /favorites
GET             /favorites/{movieId}
GET             /recommendations
```

### Admin — `/api/admin` (admin role)

```http
GET    /summary
GET    /movies
PATCH  /movies/{movieId}
DELETE /movies/{movieId}
GET    /users
PATCH  /users/{userId}/role
GET    /bookings
...
```

### TMDB — `/api/tmdb`

```http
GET    /movies/search?q=...
POST   /movies/{tmdbId}/import
POST   /movies/import
```

### Other

```http
GET    /cinemas
GET    /cinemas/{id}
GET    /notifications
PATCH  /notifications/{id}/read
PATCH  /notifications/read-all
GET    /payments/vnpay/return
```

---

## Main frontend routes

Auth uses a modal on most pages (no dedicated `/login` route).

```text
/                              Home
/movies/showing-now            Now showing
/movies/coming-soon            Coming soon
/movies/:movieRef              Movie detail (id or slug)
/booking/:movieRef             Movie detail (booking entry)
/booking/:showtimeId/seats     Seat selection
/booking/:showtimeId/food      Food & drink
/booking/:showtimeId/payment   Payment
/my-booking                    Bookings list
/my-booking/:bookingId         Booking detail
/profile                       Profile
/cinemas                       Cinemas
/actors/:actorName/movies      Actor filmography
/admin                         Admin dashboard
/admin/movies, /admin/imports  TMDB import (admin)
/tmdb                          TMDB import (admin)
/oauth/callback                OAuth return
/reset-password                Password reset
/contact, /terms, /privacy     Info pages
```

---

## Design system

Core UI building blocks:

```text
Button, Navbar, Footer, Logo, Avatar
MovieCard, ScoreBadge, RatingBadge
DateChip, SeatButton, SeatMap, BookingProgress
AuthModal, User dashboard cards (profile / bookings)
```

---

## Git ignore

Already covered in root `.gitignore`. Never commit:

- `backend/.env.local`, `backend/.env`, `backend/target/`
- `frontend/.env`, `frontend/.env.local`, `frontend/node_modules/`, `frontend/dist/`

---

## Common issues

### Frontend cannot reach the API

1. Backend is running on port 8080.
2. `VITE_API_BASE_URL` ends with `/api`.
3. Restart Vite after changing `.env`.
4. CORS allows `http://localhost:5173` (configured in Spring Security).

### `ERR_CONNECTION_REFUSED`

Backend is not running or the URL/port in `frontend/.env` is wrong.

### Flyway / Supabase errors on startup

1. `DATABASE_URL`, username, and password are correct and include `sslmode=require`.
2. Try session URL (port `5432`) for the first migration.
3. Check Supabase dashboard — project not paused, IP allowlist if enabled.

### TMDB import fails

1. Set `TMDB_API_READ_ACCESS_TOKEN` in `backend/.env.local` (v4 read token, not legacy API key name).
2. Restart the backend after changing env vars.

### Hibernate schema validation failed

Database schema is behind the code. Ensure `FLYWAY_ENABLED=true` and restart, or run `scripts/migrate-db.sh` against the same database.

---

## Demo flow

```text
Home → Movies → Movie detail → Pick date/showtime → Seats → Food (optional) → Payment → My booking
```

Admin: `/admin` for stats; `/admin/imports` for TMDB import.

---

## Author

Nguyen Ngoc Huy Hoang — hoangnnh
