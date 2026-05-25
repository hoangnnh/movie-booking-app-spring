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
import com.cinemabooking.service.ShowtimeSeedService;

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
    private final ShowtimeSeedService showtimeSeedService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedDefaultCinemas();
        ensureRoomsForCinemas();

        if (movieRepository.count() > 0) {
            movieRepository.findAll().forEach(showtimeSeedService::createShowtimesForMovieIfMissing);
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

        Cinema cinema = cinemaRepository.findAllByOrderByBrandAscNameAsc()
                .stream()
                .findFirst()
                .orElseGet(() -> {
                    Cinema fallbackCinema = new Cinema();
                    fallbackCinema.setName("IE303 Cinema");
                    fallbackCinema.setBrand("Ticketor");
                    fallbackCinema.setAddress("University Campus");
                    fallbackCinema.setDistrict("Thu Duc City");
                    fallbackCinema.setCity("Ho Chi Minh City");
                    fallbackCinema.setHotline("1900 0000");
                    fallbackCinema.setAmenities("Standard, Online booking");
                    return cinemaRepository.save(fallbackCinema);
                });

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
        movieRepository.findAll().forEach(showtimeSeedService::createShowtimesForMovieIfMissing);
    }

    private void seedDefaultCinemas() {
        List<CinemaSeed> cinemas = List.of(
                new CinemaSeed("CGV Hùng Vương Plaza", "CGV", "Level 7, Hùng Vương Plaza, 126 Hùng Vương", "District 5", "1900 6017", "IMAX, 3D, Online booking, Concessions"),
                new CinemaSeed("CGV Liberty Citypoint", "CGV", "59 Pasteur", "District 1", "1900 6017", "Premium seats, 3D, Online booking, Concessions"),
                new CinemaSeed("CGV Liberty Hoàng Văn Thụ", "CGV", "415 Hoàng Văn Thụ", "Tan Binh District", "1900 6017", "IMAX, 3D, Online booking, Concessions"),
                new CinemaSeed("CGV Lý Chính Thắng", "CGV", "Level 3, Intresco Plaza, 83 Lý Chính Thắng", "District 3", "1900 6017", "3D, Online booking, Concessions"),
                new CinemaSeed("CGV SC VivoCity", "CGV", "Level 5, SC VivoCity, 1058 Nguyễn Văn Linh", "District 7", "1900 6017", "IMAX, 4DX, 3D, Online booking"),
                new CinemaSeed("CGV Sư Vạn Hạnh", "CGV", "Level 6, Vạn Hạnh Mall, 11 Sư Vạn Hạnh", "District 10", "1900 6017", "3D, Online booking, Concessions"),
                new CinemaSeed("CGV Vincom Center Landmark 81", "CGV", "B1, Vincom Center Landmark 81, 772 Điện Biên Phủ", "Binh Thanh District", "1900 6017", "Premium seats, 3D, Online booking"),
                new CinemaSeed("CGV Vincom Đồng Khởi", "CGV", "72 Lê Thánh Tôn and 45A Lý Tự Trọng", "District 1", "1900 6017", "Premium seats, 3D, Online booking"),
                new CinemaSeed("CGV Vincom Gò Vấp", "CGV", "12 Phan Văn Trị", "Go Vap District", "1900 6017", "3D, Online booking, Concessions"),
                new CinemaSeed("CGV Aeon Tân Phú", "CGV", "Level 3, Aeon Mall Tân Phú Celadon, 30 Bờ Bao Tân Thắng", "Tan Phu District", "1900 6017", "4DX, 3D, Online booking"),
                new CinemaSeed("CGV Pandora City", "CGV", "Level 3, Pandora City, 1/1 Trường Chinh", "Tan Phu District", "1900 6017", "3D, Online booking, Concessions"),
                new CinemaSeed("CGV Gigamall Thủ Đức", "CGV", "Gigamall, 240-242 Phạm Văn Đồng", "Thu Duc City", "1900 6017", "3D, Online booking, Concessions"),
                new CinemaSeed("Galaxy Nguyễn Du", "Galaxy", "116 Nguyễn Du", "District 1", "1900 2224", "3D, Online booking, Concessions"),
                new CinemaSeed("Galaxy Kinh Dương Vương", "Galaxy", "718bis Kinh Dương Vương", "District 6", "1900 2224", "3D, Online booking, Concessions"),
                new CinemaSeed("Galaxy Quang Trung", "Galaxy", "304A Quang Trung", "Go Vap District", "1900 2224", "3D, Online booking, Concessions"),
                new CinemaSeed("Galaxy Sala", "Galaxy", "Level 3, Thiso Mall Sala, 10 Mai Chí Thọ", "Thu Duc City", "1900 2224", "3D, Online booking, Concessions"),
                new CinemaSeed("Galaxy Parc Mall Q8", "Galaxy", "Level 4, Parc Mall, 547-549 Tạ Quang Bửu", "District 8", "1900 2224", "3D, Online booking, Concessions"),
                new CinemaSeed("Lotte Cinema Gò Vấp", "Lotte Cinema", "Level 3, Lotte Mart Gò Vấp, 242 Nguyễn Văn Lượng", "Go Vap District", "1900 0000", "3D, Online booking, Concessions"),
                new CinemaSeed("Lotte Cinema Gold View", "Lotte Cinema", "Level 3, TNL Plaza, 346 Bến Vân Đồn", "District 4", "1900 0000", "3D, Online booking, Concessions"),
                new CinemaSeed("Lotte Cinema Nam Sài Gòn", "Lotte Cinema", "Level 3, Lotte Mart, 469 Nguyễn Hữu Thọ", "District 7", "1900 0000", "3D, Online booking, Concessions"),
                new CinemaSeed("Lotte Cinema Nowzone", "Lotte Cinema", "Level 5, Nowzone, 235 Nguyễn Văn Cừ", "District 1", "1900 0000", "3D, Online booking, Concessions"),
                new CinemaSeed("Lotte Cinema Cantavil", "Lotte Cinema", "Level 7, Cantavil Premier, Xa lộ Hà Nội", "Thu Duc City", "1900 0000", "3D, Online booking, Concessions"),
                new CinemaSeed("BHD Star Phạm Hùng", "BHD Star", "Level 4, Satra Phạm Hùng Shopping Center", "District 8", "1900 2099", "3D, Online booking, Concessions"),
                new CinemaSeed("BHD Star Quang Trung", "BHD Star", "B1-B2, Vincom Plaza, 190 Quang Trung", "Go Vap District", "1900 2099", "3D, Online booking, Concessions"),
                new CinemaSeed("BHD Star Bitexco", "BHD Star", "Level 3-4, Bitexco Financial Tower, 2 Hải Triều", "District 1", "1900 2099", "Premium seats, 3D, Online booking"),
                new CinemaSeed("Beta Ung Văn Khiêm", "Beta Cinemas", "Ground floor, Pax Sky Building, 26 Ung Văn Khiêm", "Binh Thanh District", "1900 636 807", "3D, Online booking, Concessions"),
                new CinemaSeed("Beta Trần Quang Khải", "Beta Cinemas", "62 Trần Quang Khải", "District 1", "1900 636 807", "3D, Online booking, Concessions"),
                new CinemaSeed("Cinestar Hai Bà Trưng", "Cinestar", "135 Hai Bà Trưng", "District 1", "1900 1722", "3D, Online booking, Concessions"),
                new CinemaSeed("Cinestar Quốc Thanh", "Cinestar", "271 Nguyễn Trãi", "District 1", "1900 1722", "3D, Online booking, Concessions"),
                new CinemaSeed("Mega GS Cao Thắng", "Mega GS", "19 Cao Thắng", "District 3", "028 6264 9911", "3D, Online booking, Concessions")
        );

        cinemas.forEach(seed -> {
            if (cinemaRepository.existsByName(seed.name())) {
                return;
            }

            Cinema cinema = new Cinema();
            cinema.setName(seed.name());
            cinema.setBrand(seed.brand());
            cinema.setAddress(seed.address());
            cinema.setDistrict(seed.district());
            cinema.setCity("Ho Chi Minh City");
            cinema.setHotline(seed.hotline());
            cinema.setAmenities(seed.amenities());
            cinema.setImageUrl(imageForBrand(seed.brand()));
            cinemaRepository.save(cinema);
        });
    }

    private void ensureRoomsForCinemas() {
        cinemaRepository.findAllByOrderByBrandAscNameAsc().forEach(cinema -> {
            if (!roomRepository.findByCinema_IdOrderByNameAsc(cinema.getId()).isEmpty()) {
                return;
            }

            Room room = new Room();
            room.setCinema(cinema);
            room.setName("Auditorium 1");
            roomRepository.save(room);
            showtimeSeedService.ensureSeats(room);
        });
    }

    private String imageForBrand(String brand) {
        return switch (brand) {
            case "CGV" -> "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80";
            case "Galaxy" -> "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80";
            case "Lotte Cinema" -> "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1200&q=80";
            case "BHD Star" -> "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=1200&q=80";
            default -> "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80";
        };
    }

    private record CinemaSeed(
            String name,
            String brand,
            String address,
            String district,
            String hotline,
            String amenities
    ) {
    }
}
