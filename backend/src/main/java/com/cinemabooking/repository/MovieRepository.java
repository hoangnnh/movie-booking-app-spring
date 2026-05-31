package com.cinemabooking.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cinemabooking.entity.Movie;
import com.cinemabooking.enums.MovieDisplayStatus;

public interface MovieRepository extends JpaRepository<Movie, UUID> {
    Optional<Movie> findByTmdbId(Integer tmdbId);

    Optional<Movie> findBySlug(String slug);

    Optional<Movie> findFirstByTitleIgnoreCaseOrderByCreatedAtAsc(String title);

    List<Movie> findAllByOrderByCreatedAtDescTitleAsc();

    List<Movie> findByDisplayStatusOrderByCreatedAtDescTitleAsc(MovieDisplayStatus displayStatus, Pageable pageable);

    long countByDisplayStatus(MovieDisplayStatus displayStatus);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Movie movie
            set movie.displayStatus = :showingNowStatus
            where movie.displayStatus = :comingSoonStatus
              and movie.releaseDate <= :today
            """)
    int promoteReleasedComingSoonMovies(
            @Param("comingSoonStatus") MovieDisplayStatus comingSoonStatus,
            @Param("showingNowStatus") MovieDisplayStatus showingNowStatus,
            @Param("today") LocalDate today
    );

    @Query(
            value = """
                    select distinct movie
                    from Movie movie
                    left join movie.genres genre
                    where movie.displayStatus = :displayStatus
                      and (
                          :query = ''
                          or lower(movie.title) like lower(concat('%', :query, '%'))
                          or lower(coalesce(movie.description, '')) like lower(concat('%', :query, '%'))
                      )
                      and (:genre = '' or lower(genre.name) = lower(:genre))
                    """,
            countQuery = """
                    select count(distinct movie.id)
                    from Movie movie
                    left join movie.genres genre
                    where movie.displayStatus = :displayStatus
                      and (
                          :query = ''
                          or lower(movie.title) like lower(concat('%', :query, '%'))
                          or lower(coalesce(movie.description, '')) like lower(concat('%', :query, '%'))
                      )
                      and (:genre = '' or lower(genre.name) = lower(:genre))
                    """
    )
    Page<Movie> findCatalogMovies(
            @Param("displayStatus") MovieDisplayStatus displayStatus,
            @Param("query") String query,
            @Param("genre") String genre,
            Pageable pageable
    );

    @Query("""
            select distinct genre.name
            from Movie movie
            join movie.genres genre
            where movie.displayStatus = :displayStatus
            order by genre.name
            """)
    List<String> findGenreNamesByDisplayStatus(@Param("displayStatus") MovieDisplayStatus displayStatus);

    @Query(
            value = """
                    select movie
                    from Movie movie
                    where :query = ''
                       or lower(movie.title) like lower(concat('%', :query, '%'))
                       or lower(coalesce(movie.description, '')) like lower(concat('%', :query, '%'))
                    """,
            countQuery = """
                    select count(movie.id)
                    from Movie movie
                    where :query = ''
                       or lower(movie.title) like lower(concat('%', :query, '%'))
                       or lower(coalesce(movie.description, '')) like lower(concat('%', :query, '%'))
                    """
    )
    Page<Movie> findAdminMovies(@Param("query") String query, Pageable pageable);

    @Query("""
            select movie
            from Movie movie
            where not exists (
                select showtime.id
                from Showtime showtime
                where showtime.movie = movie
            )
            order by movie.createdAt desc, movie.title asc
            """)
    List<Movie> findMoviesWithoutShowtimes(Pageable pageable);

    @Query("""
            select distinct movie
            from Movie movie
            join movie.castMembers castMember
            where lower(castMember.name) = lower(:actorName)
            order by movie.createdAt desc, movie.title asc
            """)
    List<Movie> findAllByActorName(@Param("actorName") String actorName);

    @Query(value = """
            select
                m.id as id,
                m.title as title,
                m.poster_url as posterUrl,
                m.release_date as releaseDate
            from movies m
            where lower(m.title) like :prefixPattern escape '\\'
               or similarity(lower(m.title), lower(:query)) >= :minSimilarity
               or to_tsvector('simple', coalesce(m.title, '')) @@ to_tsquery('simple', :tsQuery)
            order by
                case
                    when lower(m.title) like :prefixPattern escape '\\' then 0
                    else 1
                end,
                similarity(lower(m.title), lower(:query)) desc,
                m.title asc
            """, nativeQuery = true)
    List<MovieAutocompleteProjection> autocompleteByTitle(
            @Param("query") String query,
            @Param("tsQuery") String tsQuery,
            @Param("prefixPattern") String prefixPattern,
            @Param("minSimilarity") double minSimilarity,
            Pageable pageable
    );
}
