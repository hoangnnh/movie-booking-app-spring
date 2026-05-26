import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.Date;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Properties;

public class BackfillMovieTrailers {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();

    public static void main(String[] args) throws Exception {
        Path backendRoot = Path.of("D:/movie-booking-app-spring/backend");
        Properties appProperties = loadProperties(backendRoot.resolve("src/main/resources/application.properties"));
        TmdbCredentials credentials = loadTmdbCredentials(backendRoot.resolve(".env.local"));

        if (credentials.isEmpty()) {
            throw new IllegalStateException(
                    "TMDB credentials are missing in backend/.env.local. Set TMDB_API_READ_ACCESS_TOKEN or TMDB_API_KEY."
            );
        }

        String dbUrl = appProperties.getProperty("spring.datasource.url");
        String dbUser = appProperties.getProperty("spring.datasource.username");
        String dbPassword = appProperties.getProperty("spring.datasource.password");

        int scanned = 0;
        int updated = 0;
        int matchedByTitle = 0;
        int missingTmdbMatch = 0;
        int missingTrailer = 0;

        try (Connection connection = DriverManager.getConnection(dbUrl, dbUser, dbPassword)) {
            List<MovieRecord> movies = loadMovies(connection);

            for (MovieRecord movie : movies) {
                scanned++;

                Integer tmdbId = movie.tmdbId();

                if (tmdbId == null) {
                    tmdbId = findBestTmdbMatchId(movie, credentials);

                    if (tmdbId == null) {
                        missingTmdbMatch++;
                        System.out.println("No TMDB match for: " + movie.title());
                        continue;
                    }

                    matchedByTitle++;
                }

                String trailerUrl = fetchTrailerUrl(tmdbId, credentials);

                if (trailerUrl.isBlank()) {
                    missingTrailer++;
                    System.out.println("No trailer on TMDB for: " + movie.title());
                    continue;
                }

                Integer nextTmdbId = movie.tmdbId();
                boolean shouldUpdateTmdbId = false;

                if (!tmdbId.equals(movie.tmdbId())) {
                    if (movieExistsWithTmdbId(connection, movie.id(), tmdbId)) {
                        System.out.println("TMDB id already linked elsewhere, updating trailer only for: " + movie.title());
                    } else {
                        nextTmdbId = tmdbId;
                        shouldUpdateTmdbId = true;
                    }
                }

                boolean shouldUpdateTrailer = !trailerUrl.equals(blankToEmpty(movie.trailerUrl()));

                if (shouldUpdateTmdbId || shouldUpdateTrailer) {
                    updateMovie(connection, movie.id(), shouldUpdateTmdbId ? nextTmdbId : movie.tmdbId(), trailerUrl, shouldUpdateTmdbId);
                    updated++;
                    System.out.println("Updated trailer for: " + movie.title());
                } else {
                    System.out.println("Already up to date: " + movie.title());
                }
            }
        }

        System.out.println();
        System.out.println("Trailer backfill finished.");
        System.out.println("Scanned movies: " + scanned);
        System.out.println("Updated trailers: " + updated);
        System.out.println("Matched by title: " + matchedByTitle);
        System.out.println("Missing TMDB match: " + missingTmdbMatch);
        System.out.println("Missing trailer on TMDB: " + missingTrailer);
    }

    private static List<MovieRecord> loadMovies(Connection connection) throws SQLException {
        String sql = """
                select id, tmdb_id, title, release_date, trailer_url
                from movies
                order by created_at asc nulls last, title asc
                """;

        List<MovieRecord> movies = new ArrayList<>();

        try (PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                Date releaseDate = resultSet.getDate("release_date");
                movies.add(new MovieRecord(
                        resultSet.getString("id"),
                        (Integer) resultSet.getObject("tmdb_id"),
                        resultSet.getString("title"),
                        releaseDate == null ? null : releaseDate.toLocalDate(),
                        resultSet.getString("trailer_url")
                ));
            }
        }

        return movies;
    }

    private static void updateMovie(
            Connection connection,
            String id,
            Integer tmdbId,
            String trailerUrl,
            boolean updateTmdbId
    ) throws SQLException {
        if (updateTmdbId) {
            String sql = """
                    update movies
                    set tmdb_id = ?, trailer_url = ?
                    where id = ?::uuid
                    """;

            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                statement.setInt(1, tmdbId);
                statement.setString(2, trailerUrl);
                statement.setString(3, id);
                statement.executeUpdate();
            }
            return;
        }

        String sql = """
                update movies
                set trailer_url = ?
                where id = ?::uuid
                """;

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, trailerUrl);
            statement.setString(2, id);
            statement.executeUpdate();
        }
    }

    private static boolean movieExistsWithTmdbId(Connection connection, String currentMovieId, Integer tmdbId) throws SQLException {
        String sql = """
                select exists(
                    select 1
                    from movies
                    where tmdb_id = ?
                      and id <> ?::uuid
                )
                """;

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, tmdbId);
            statement.setString(2, currentMovieId);

            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getBoolean(1);
            }
        }
    }

    private static Integer findBestTmdbMatchId(MovieRecord movie, TmdbCredentials credentials)
            throws IOException, InterruptedException {
        JsonNode results = searchMovies(movie.title(), credentials);
        JsonNode bestMatch = null;
        int bestScore = 0;

        for (JsonNode candidate : results) {
            int score = scoreMovieMatch(movie, candidate);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = candidate;
            }
        }

        if (bestMatch == null || bestScore <= 0) {
            return null;
        }

        return bestMatch.path("id").isInt() ? bestMatch.path("id").asInt() : null;
    }

    private static JsonNode searchMovies(String title, TmdbCredentials credentials) throws IOException, InterruptedException {
        String query = URLEncoder.encode(title, StandardCharsets.UTF_8);
        URI uri = buildTmdbUri(
                "https://api.themoviedb.org/3/search/movie?query=" + query + "&include_adult=false&language=en-US&page=1",
                credentials
        );
        JsonNode body = sendTmdbRequest(uri, credentials);
        return body.path("results");
    }

    private static String fetchTrailerUrl(int tmdbId, TmdbCredentials credentials) throws IOException, InterruptedException {
        URI uri = buildTmdbUri(
                "https://api.themoviedb.org/3/movie/" + tmdbId + "?language=en-US&append_to_response=videos",
                credentials
        );
        JsonNode body = sendTmdbRequest(uri, credentials);
        JsonNode videos = body.path("videos").path("results");

        return streamArray(videos).stream()
                .max(Comparator.comparingInt(BackfillMovieTrailers::scoreVideo))
                .map(BackfillMovieTrailers::toTrailerUrl)
                .filter((value) -> !value.isBlank())
                .orElse("");
    }

    private static JsonNode sendTmdbRequest(URI uri, TmdbCredentials credentials) throws IOException, InterruptedException {
        HttpResponse<String> response = sendRequest(uri, credentials.readAccessToken());

        if (response.statusCode() == 401 && credentials.apiKey() != null && !credentials.apiKey().isBlank()) {
            URI apiKeyUri = withApiKey(uri, credentials.apiKey());
            response = sendRequest(apiKeyUri, null);
        }

        if (response.statusCode() >= 400) {
            throw new IOException("TMDB request failed with status " + response.statusCode() + " for " + uri);
        }

        return OBJECT_MAPPER.readTree(response.body());
    }

    private static HttpResponse<String> sendRequest(URI uri, String bearerToken) throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder(uri)
                .header("Accept", "application/json")
                .GET();

        if (bearerToken != null && !bearerToken.isBlank()) {
            builder.header("Authorization", "Bearer " + bearerToken);
        }

        return HTTP_CLIENT.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private static URI buildTmdbUri(String baseUrl, TmdbCredentials credentials) {
        URI uri = URI.create(baseUrl);

        if (credentials.hasReadAccessToken()) {
            return uri;
        }

        return withApiKey(uri, credentials.apiKey());
    }

    private static URI withApiKey(URI uri, String apiKey) {
        String separator = uri.toString().contains("?") ? "&" : "?";
        return URI.create(uri + separator + "api_key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8));
    }

    private static int scoreMovieMatch(MovieRecord movie, JsonNode candidate) {
        int score = 0;
        String movieTitle = normalizeTitle(movie.title());
        String candidateTitle = normalizeTitle(candidate.path("title").asText(""));

        if (movieTitle.equals(candidateTitle)) {
            score += 150;
        } else if (candidateTitle.contains(movieTitle) || movieTitle.contains(candidateTitle)) {
            score += 80;
        }

        LocalDate candidateReleaseDate = parseDate(candidate.path("release_date").asText(""));

        if (movie.releaseDate() != null && candidateReleaseDate != null) {
            if (movie.releaseDate().getYear() == candidateReleaseDate.getYear()) {
                score += 40;
            }

            long dayDifference = Math.abs(movie.releaseDate().toEpochDay() - candidateReleaseDate.toEpochDay());

            if (dayDifference <= 31) {
                score += 20;
            }
        }

        return score;
    }

    private static int scoreVideo(JsonNode video) {
        int score = 0;
        String site = video.path("site").asText("");
        String type = video.path("type").asText("");

        if ("YouTube".equalsIgnoreCase(site)) {
            score += 100;
        } else if ("Vimeo".equalsIgnoreCase(site)) {
            score += 50;
        }

        if ("Trailer".equalsIgnoreCase(type)) {
            score += 40;
        } else if ("Teaser".equalsIgnoreCase(type)) {
            score += 20;
        }

        if (video.path("official").asBoolean(false)) {
            score += 20;
        }

        if ("en".equalsIgnoreCase(video.path("iso_639_1").asText(""))) {
            score += 10;
        }

        return score;
    }

    private static String toTrailerUrl(JsonNode video) {
        String key = video.path("key").asText("").trim();
        String site = video.path("site").asText("").trim();

        if (key.isBlank()) {
            return "";
        }

        if ("YouTube".equalsIgnoreCase(site)) {
            return "https://www.youtube.com/watch?v=" + key;
        }

        if ("Vimeo".equalsIgnoreCase(site)) {
            return "https://vimeo.com/" + key;
        }

        return "";
    }

    private static List<JsonNode> streamArray(JsonNode node) {
        List<JsonNode> items = new ArrayList<>();
        if (node == null || !node.isArray()) {
            return items;
        }
        node.forEach(items::add);
        return items;
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return LocalDate.parse(value);
    }

    private static String normalizeTitle(String value) {
        return value == null
                ? ""
                : value.toLowerCase().replaceAll("[^a-z0-9]+", " ").trim();
    }

    private static String blankToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static Properties loadProperties(Path path) throws IOException {
        Properties properties = new Properties();
        try (var reader = Files.newBufferedReader(path)) {
            properties.load(reader);
        }
        return properties;
    }

    private static TmdbCredentials loadTmdbCredentials(Path envPath) throws IOException {
        String readAccessToken = null;
        String apiKey = null;

        for (String line : Files.readAllLines(envPath)) {
            if (line.startsWith("export TMDB_API_READ_ACCESS_TOKEN=")) {
                readAccessToken = line.substring("export TMDB_API_READ_ACCESS_TOKEN=".length()).trim();
            }

            if (line.startsWith("TMDB_API_READ_ACCESS_TOKEN=")) {
                readAccessToken = line.substring("TMDB_API_READ_ACCESS_TOKEN=".length()).trim();
            }

            if (line.startsWith("export TMDB_API_KEY=")) {
                apiKey = line.substring("export TMDB_API_KEY=".length()).trim();
            }

            if (line.startsWith("TMDB_API_KEY=")) {
                apiKey = line.substring("TMDB_API_KEY=".length()).trim();
            }
        }

        return new TmdbCredentials(blankToNull(readAccessToken), blankToNull(apiKey));
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value;
    }

    private record MovieRecord(
            String id,
            Integer tmdbId,
            String title,
            LocalDate releaseDate,
            String trailerUrl
    ) {
    }

    private record TmdbCredentials(
            String readAccessToken,
            String apiKey
    ) {
        private boolean hasReadAccessToken() {
            return readAccessToken != null && !readAccessToken.isBlank();
        }

        private boolean isEmpty() {
            return !hasReadAccessToken() && (apiKey == null || apiKey.isBlank());
        }
    }
}
