package com.cinemabooking.entity;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.BatchSize;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.cinemabooking.enums.MovieDisplayStatus;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "movies",
        indexes = @Index(
                name = "idx_movies_display_status_created_at_title",
                columnList = "display_status, created_at DESC, title"
        )
)
public class Movie extends BaseEntity {

    @Column(name = "tmdb_id", unique = true)
    private Integer tmdbId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(unique = true, length = 240)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "poster_url")
    private String posterUrl;

    @Column(name = "backdrop_url")
    private String backdropUrl;

    @Column(name = "trailer_url", length = 500)
    private String trailerUrl;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "rating")
    private Double rating;

    @Column(name = "age_rating", nullable = false, length = 10, columnDefinition = "VARCHAR(10) DEFAULT 'T13'")
    private String ageRating = "T13";

    @Enumerated(EnumType.STRING)
    @Column(name = "display_status", nullable = false, length = 30, columnDefinition = "VARCHAR(30) DEFAULT 'HIDDEN'")
    private MovieDisplayStatus displayStatus = MovieDisplayStatus.HIDDEN;

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private Set<MovieCastMember> castMembers = new LinkedHashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @BatchSize(size = 50)
    @JoinTable(
            name = "movie_genres",
            joinColumns = @JoinColumn(name = "movie_id"),
            inverseJoinColumns = @JoinColumn(name = "genre_id")
    )
    private Set<Genre> genres = new HashSet<>();
}
