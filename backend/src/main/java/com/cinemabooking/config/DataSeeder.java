package com.cinemabooking.config;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.cinemabooking.entity.AppUser;
import com.cinemabooking.entity.Cinema;
import com.cinemabooking.entity.Genre;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.entity.Room;
import com.cinemabooking.enums.AuthProvider;
import com.cinemabooking.enums.Role;
import com.cinemabooking.repository.AppUserRepository;
import com.cinemabooking.repository.CinemaRepository;
import com.cinemabooking.repository.GenreRepository;
import com.cinemabooking.repository.MovieRepository;
import com.cinemabooking.repository.RoomRepository;
import com.cinemabooking.service.ShowtimeSeedService;
import com.cinemabooking.service.TmdbService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AppUserRepository appUserRepository;
    private final GenreRepository genreRepository;
    private final MovieRepository movieRepository;
    private final CinemaRepository cinemaRepository;
    private final RoomRepository roomRepository;
    private final ShowtimeSeedService showtimeSeedService;
    private final PasswordEncoder passwordEncoder;
    private final TmdbService tmdbService;

    @Value("${app.seed.tmdb.enabled:true}")
    private boolean tmdbSeedEnabled;

    @Value("${app.seed.tmdb.lists:now_playing,popular,upcoming}")
    private String tmdbSeedLists;

    @Value("${app.seed.tmdb.pages-per-list:2}")
    private int tmdbSeedPagesPerList;

    @Override
    public void run(String... args) {
        seedDefaultCinemas();
        ensureRoomsForCinemas();
        seedDemoUser();

        Genre action = getOrCreateGenre("Action");
        Genre sciFi = getOrCreateGenre("Sci-Fi");
        Genre drama = getOrCreateGenre("Drama");

        seedFallbackMovies(action, sciFi, drama);
        importTmdbCatalogIfConfigured();
        movieRepository.findAll().forEach(showtimeSeedService::createShowtimesForMovieIfMissing);
    }

    private void seedDemoUser() {
        if (appUserRepository.findByEmail("user@example.com").isPresent()) {
            return;
        }

        AppUser user = new AppUser();
        user.setFullName("Demo User");
        user.setEmail("user@example.com");
        user.setPassword(passwordEncoder.encode("123456"));
        user.setRole(Role.USER);
        user.setProvider(AuthProvider.LOCAL);
        appUserRepository.save(user);
    }

    private void seedFallbackMovies(Genre action, Genre sciFi, Genre drama) {
        List.of(
                upsertMovie(157336, "Interstellar",
                        "A science fiction film about space, time, and survival.",
                        169, LocalDate.of(2014, 11, 7), sciFi, drama),
                upsertMovie(245891, "John Wick",
                        "An action thriller about a retired hitman seeking vengeance.",
                        101, LocalDate.of(2014, 10, 24), action, drama),
                upsertMovie(null, "Oppenheimer",
                        "The story of J. Robert Oppenheimer and the creation of the atomic bomb.",
                        180, LocalDate.of(2023, 7, 21), drama),
                upsertMovie(null, "Dune: Part Two",
                        "Paul Atreides joins forces with the Fremen to fight for Arrakis.",
                        166, LocalDate.of(2024, 3, 1), sciFi, drama),
                upsertMovie(null, "The Batman",
                        "Batman investigates corruption in Gotham while facing the Riddler.",
                        176, LocalDate.of(2022, 3, 4), action, drama),
                upsertMovie(null, "Top Gun: Maverick",
                        "Maverick returns to train a new generation of elite fighter pilots.",
                        131, LocalDate.of(2022, 5, 27), action, drama),
                upsertMovie(null, "Avatar: The Way of Water",
                        "Jake Sully and Neytiri fight to protect their family and home.",
                        192, LocalDate.of(2022, 12, 16), sciFi, drama),
                upsertMovie(null, "Spider-Man: Across the Spider-Verse",
                        "Miles Morales journeys across the multiverse and meets a team of Spider-People.",
                        140, LocalDate.of(2023, 6, 2), action, sciFi),
                upsertMovie(null, "Inception",
                        "A skilled thief enters dreams to steal secrets and plant an idea.",
                        148, LocalDate.of(2010, 7, 16), sciFi, action),
                upsertMovie(null, "Mission: Impossible - Dead Reckoning Part One",
                        "Ethan Hunt races to stop a terrifying new weapon from falling into the wrong hands.",
                        163, LocalDate.of(2023, 7, 12), action, drama),
                upsertMovie(null, "Inside Out 2",
                        "Riley faces new emotions as she enters her teenage years.",
                        96, LocalDate.of(2024, 6, 14), drama),
                upsertMovie(null, "The Wild Robot",
                        "A robot stranded on an island learns to survive and connect with animals.",
                        102, LocalDate.of(2024, 9, 27), sciFi, drama)
        );
    }

    private void importTmdbCatalogIfConfigured() {
        if (!tmdbSeedEnabled) {
            return;
        }

        int pages = Math.max(1, Math.min(tmdbSeedPagesPerList, 5));
        List<String> lists = parseTmdbSeedLists();

        if (lists.isEmpty()) {
            return;
        }

        for (String list : lists) {
            try {
                tmdbService.importMoviesByList(list, pages);
            } catch (RuntimeException exception) {
                System.out.println("Skipping TMDB seed for list '" + list + "': " + exception.getMessage());
            }
        }
    }

    private List<String> parseTmdbSeedLists() {
        return java.util.Arrays.stream(tmdbSeedLists.split(","))
                .map(String::trim)
                .filter((value) -> !value.isBlank())
                .distinct()
                .toList();
    }

    private Movie upsertMovie(
            Integer tmdbId,
            String title,
            String description,
            int durationMinutes,
            LocalDate releaseDate,
            Genre... genres
    ) {
        Movie movie = tmdbId == null
                ? movieRepository.findFirstByTitleIgnoreCaseOrderByCreatedAtAsc(title).orElseGet(Movie::new)
                : movieRepository.findByTmdbId(tmdbId)
                        .or(() -> movieRepository.findFirstByTitleIgnoreCaseOrderByCreatedAtAsc(title))
                        .orElseGet(Movie::new);

        movie.setTmdbId(tmdbId);
        movie.setTitle(title);
        movie.setDescription(description);
        movie.setDurationMinutes(durationMinutes);
        movie.setPosterUrl("https://example.com/" + title.toLowerCase().replaceAll("[^a-z0-9]+", "-") + ".jpg");
        movie.setReleaseDate(releaseDate);
        movie.setGenres(new HashSet<>(Set.of(genres)));
        return movieRepository.save(movie);
    }

    private Genre getOrCreateGenre(String name) {
        return genreRepository.findByName(name)
                .orElseGet(() -> {
                    Genre genre = new Genre();
                    genre.setName(name);
                    return genreRepository.save(genre);
                });
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
