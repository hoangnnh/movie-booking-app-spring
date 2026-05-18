package com.cinemabooking.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.cinemabooking.entity.AppUser;
import com.cinemabooking.entity.Cinema;
import com.cinemabooking.entity.Genre;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.entity.Room;
import com.cinemabooking.entity.Seat;
import com.cinemabooking.entity.Showtime;
import com.cinemabooking.enums.AuthProvider;
import com.cinemabooking.enums.Role;
import com.cinemabooking.repository.AppUserRepository;
import com.cinemabooking.repository.CinemaRepository;
import com.cinemabooking.repository.GenreRepository;
import com.cinemabooking.repository.MovieRepository;
import com.cinemabooking.repository.RoomRepository;
import com.cinemabooking.repository.SeatRepository;
import com.cinemabooking.repository.ShowtimeRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AppUserRepository appUserRepository;
    private final GenreRepository genreRepository;
    private final MovieRepository movieRepository;
    private final CinemaRepository cinemaRepository;
    private final RoomRepository roomRepository;
    private final SeatRepository seatRepository;
    private final ShowtimeRepository showtimeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (movieRepository.count() > 0) {
            return;
        }

        AppUser user = new AppUser();
        user.setFullName("Demo User");
        user.setEmail("user@example.com");
        user.setPassword(passwordEncoder.encode("123456"));
        user.setRole(Role.USER);
        user.setProvider(AuthProvider.LOCAL);
        appUserRepository.save(user);

        Genre action = new Genre();
        action.setName("Action");

        Genre sciFi = new Genre();
        sciFi.setName("Sci-Fi");

        Genre drama = new Genre();
        drama.setName("Drama");

        genreRepository.saveAll(List.of(action, sciFi, drama));

        Movie movie1 = new Movie();
        movie1.setTitle("Interstellar");
        movie1.setDescription("A science fiction film about space, time, and survival.");
        movie1.setDurationMinutes(169);
        movie1.setPosterUrl("https://example.com/interstellar.jpg");
        movie1.setReleaseDate(LocalDate.of(2014, 11, 7));
        movie1.setGenres(new HashSet<>(List.of(sciFi, drama)));

        Movie movie2 = new Movie();
        movie2.setTitle("John Wick");
        movie2.setDescription("An action thriller about a retired hitman.");
        movie2.setDurationMinutes(101);
        movie2.setPosterUrl("https://example.com/john-wick.jpg");
        movie2.setReleaseDate(LocalDate.of(2014, 10, 24));
        movie2.setGenres(new HashSet<>(List.of(action)));

        movieRepository.saveAll(List.of(movie1, movie2));

        Cinema cinema = new Cinema();
        cinema.setName("IE303 Cinema");
        cinema.setAddress("University Campus");
        cinemaRepository.save(cinema);

        Room room = new Room();
        room.setCinema(cinema);
        room.setName("Room 1");
        roomRepository.save(room);

        for (String row : List.of("A", "B", "C")) {
            for (int number = 1; number <= 8; number++) {
                Seat seat = new Seat();
                seat.setRoom(room);
                seat.setRowName(row);
                seat.setSeatNumber(number);
                seatRepository.save(seat);
            }
        }

        LocalDateTime tomorrow19h = LocalDateTime.now()
                .plusDays(1)
                .withHour(19)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);

        Showtime showtime1 = new Showtime();
        showtime1.setMovie(movie1);
        showtime1.setRoom(room);
        showtime1.setStartTime(tomorrow19h);
        showtime1.setEndTime(tomorrow19h.plusMinutes(movie1.getDurationMinutes()));
        showtime1.setPrice(new BigDecimal("75000"));

        Showtime showtime2 = new Showtime();
        showtime2.setMovie(movie2);
        showtime2.setRoom(room);
        showtime2.setStartTime(tomorrow19h.plusHours(3));
        showtime2.setEndTime(tomorrow19h.plusHours(3).plusMinutes(movie2.getDurationMinutes()));
        showtime2.setPrice(new BigDecimal("70000"));

        showtimeRepository.saveAll(List.of(showtime1, showtime2));
    }
}