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
TMDB_API_KEY=your_tmdb_api_key_here
```

Do not commit `.env.local`.

Configure PostgreSQL in:

```text
backend/src/main/resources/application.properties
```

Example:

```properties
spring.application.name=cinema-booking-server

server.port=8000

spring.datasource.url=jdbc:postgresql://localhost:5432/cinema_booking
spring.datasource.username=cinema_user
spring.datasource.password=cinema123
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

tmdb.api.key=${TMDB_API_KEY}
```

Create the database if it does not exist:

```sql
CREATE DATABASE cinema_booking;
```

Run the backend:

```bash
mvn spring-boot:run
```

Backend should be available at:

```text
http://localhost:8000
```

Test movie API:

```text
http://localhost:8000/api/movies
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
touch .env
```

Add the backend API URL:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

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
