package com.cinemabooking.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cinemabooking.entity.Movie;

public interface MovieRepository extends JpaRepository<Movie, UUID> {
    Optional<Movie> findByTmdbId(Integer tmdbId);

    Optional<Movie> findFirstByTitleIgnoreCaseOrderByCreatedAtAsc(String title);

    List<Movie> findAllByOrderByCreatedAtDescTitleAsc();

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
            select m.*
            from movies m
            where to_tsvector('simple', coalesce(m.title, '') || ' ' || coalesce(m.description, ''))
                    @@ to_tsquery('simple', :tsQuery)
                or lower(m.title) like :prefixPattern escape '\\'
                or similarity(lower(m.title), lower(:query)) >= :minSimilarity
            order by
                case
                    when lower(m.title) = lower(:query) then 0
                    when lower(m.title) like :prefixPattern escape '\\' then 1
                    else 2
                end,
                ts_rank_cd(
                    to_tsvector('simple', coalesce(m.title, '') || ' ' || coalesce(m.description, '')),
                    to_tsquery('simple', :tsQuery)
                ) desc,
                similarity(lower(m.title), lower(:query)) desc,
                m.title asc
            """, nativeQuery = true)
    List<Movie> searchByQuery(
            @Param("query") String query,
            @Param("tsQuery") String tsQuery,
            @Param("prefixPattern") String prefixPattern,
            @Param("minSimilarity") double minSimilarity
    );

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
