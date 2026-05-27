# Movie Booking App Spring

A full-stack movie ticket booking web application for a university Java project (Class name: IE303.Q21.CNVN). The system allows users to browse movies, view movie details, select showtimes, choose seats, create bookings, and view their tickets.

The project is built with a Java Spring Boot backend, React frontend, PostgreSQL database, and TMDB integration for movie data.

---

## Features

### Current MVP Features

- User registration and login
- Movie browsing page
- Movie detail page
- TMDB movie search/import support
- Showtime selection
- Seat selection
- Ticket booking flow
- User ticket/booking pages
- Desktop-first UI based on the Ticketor design system

### Planned / Future Features

- JWT authentication
- Google OAuth login
- Forgot password and email verification
- Real payment gateway integration
- Food and drink ordering
- Watchlist / favorites
- Admin dashboard
- Movie recommendation feature

---

## Tech Stack

### Backend

- Java
- Spring Boot
- Spring Web / WebMVC
- Spring Data JPA
- Spring Security
- PostgreSQL
- Lombok
- Maven
- TMDB API

### Frontend

- React
- Vite
- Tailwind CSS
- React Router DOM
- Lucide React
- React Icons
- Fetch API

### Database

- PostgreSQL

---

## Project Structure

```text
movie-booking-app-spring/
├── backend/
│   ├── src/main/java/com/cinemabooking/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── enums/
│   │   ├── repository/
│   │   └── service/
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── db/
│   └── pom.xml
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
└── README.md
```

---

## Prerequisites

Make sure these are installed:

- Java 21
- Maven
- Node.js and npm
- PostgreSQL
- Git

---

## Backend Setup

Go to the backend folder:

```bash
cd backend
```

Create a local environment file:

```bash
touch .env.local
```

Example local values:

```env
DATABASE_URL=jdbc:postgresql://your-pooler-host.supabase.com:6543/postgres?sslmode=require
DATABASE_USERNAME=postgres.your-project-ref
DATABASE_PASSWORD=your-supabase-database-password
DATABASE_MAX_POOL_SIZE=5
DATABASE_MIN_IDLE=1
JPA_DDL_AUTO=update
TMDB_API_READ_ACCESS_TOKEN=your_tmdb_read_access_token_here
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRATION_MS=86400000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APP_BACKEND_BASE_URL=http://localhost:8080
APP_FRONTEND_BASE_URL=http://localhost:5173
```

Do not commit `.env.local`.

For Supabase, use the Transaction pooler connection details from Project Settings > Database. The JDBC URL must use port `6543` and include `?sslmode=require`.

Tracked defaults live in:

```text
backend/src/main/resources/application.properties
```

The committed file reads database credentials from environment variables:

```properties
spring.application.name=cinema-booking-server

server.port=8080

spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/cinema_booking}
spring.datasource.username=${DATABASE_USERNAME:postgres}
spring.datasource.password=${DATABASE_PASSWORD:postgres}
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=${JPA_DDL_AUTO:update}
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

tmdb.api.read-access-token=${TMDB_API_READ_ACCESS_TOKEN}
jwt.secret=${JWT_SECRET}
jwt.expiration-ms=${JWT_EXPIRATION_MS}
```

Run the backend:

```bash
mvn spring-boot:run
```

Backend should be available at:

```text
http://localhost:8080
```

Test movie API:

```text
http://localhost:8080/api/movies
```

---

## Frontend Setup

Go to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a frontend environment file:

```bash
cp .env.example .env
```

Add the backend API URL:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

For Google OAuth, add `http://localhost:8080/login/oauth2/code/google` as an authorized redirect URI in your Google Cloud OAuth client.

See `SUPABASE_SETUP.md` for the full Supabase checklist.

Run the frontend:

```bash
npm run dev
```

Frontend should be available at:

```text
http://localhost:5173
```

---

## Main API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Movies

```http
GET /api/movies
GET /api/movies/{movieId}
GET /api/movies/{movieId}/showtimes
```

### TMDB

```http
GET  /api/tmdb/search
POST /api/tmdb/import/{tmdbId}
```

Exact TMDB endpoint paths may vary depending on the current backend controller implementation.

### Booking

```http
GET  /api/showtimes/{showtimeId}/seats
POST /api/bookings
GET  /api/users/{userId}/bookings
```

---

## Main Frontend Routes

```text
/                       Home page
/movies                 Movie list
/movies/:movieId        Movie detail
/booking/:showtimeId    Seat booking
/my-tickets             User tickets
/profile                User profile/dashboard
/login                  Login
/register               Sign up
```

---

## Design System

The frontend uses a desktop-first Ticketor-style UI.

Main design choices:

- Dark theme
- Manrope font
- Yellow-green primary accent
- Teal secondary accent
- 12-column centered desktop layout
- Rounded components
- Tailwind CSS tokens in `src/index.css`

Important reusable components include:

```text
Button
Navbar
Footer
MovieCard
CompactMovieCard
PromotionCard
DateChip
TimeChip
SeatButton
SeatMap
BookingProgress
TimeSelection
UserDashboard
```

---

## Git Ignore Notes

The project should not commit generated files or local secrets.

Recommended ignored files:

```gitignore
backend/.env.local
backend/.env
backend/target/

frontend/.env.local
frontend/node_modules/
frontend/dist/

.vscode/
.idea/
.DS_Store
```

---

## Common Development Issues

### Frontend cannot connect to backend

Check:

1. Backend is running.
2. Backend port matches `VITE_API_BASE_URL`.
3. Vite was restarted after editing `.env`.
4. Spring Security CORS allows `http://localhost:5173`.

### `ERR_CONNECTION_REFUSED`

This usually means the backend is not running on the port configured in the frontend `.env`.

### TMDB import does not work

Check:

1. `TMDB_API_KEY` exists.
2. Backend can read the environment variable.
3. The API key is not committed directly to Git.
4. TMDB controller/service paths match the frontend request.

---

## MVP Demo Flow

Recommended flow for demonstration:

```text
Open homepage
→ Browse movies
→ Open movie detail
→ Select showtime
→ Select seats
→ Confirm booking
→ View ticket / booking history
```

---

## Project Status

This project is currently under active development. The core booking flow is being implemented first. Advanced features such as real payment, watchlist, notifications, admin management, and AI recommendations are future improvements.

---

## Author

Nguyen Ngoc Huy Hoang - hoangnnh
