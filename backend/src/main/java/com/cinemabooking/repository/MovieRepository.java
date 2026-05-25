package com.cinemabooking.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cinemabooking.entity.Movie;

public interface MovieRepository extends JpaRepository<Movie, UUID> {
    Optional<Movie> findByTmdbId(Integer tmdbId);

    Optional<Movie> findFirstByTitleIgnoreCaseOrderByCreatedAtAsc(String title);

    @Query("""
            select distinct movie
            from Movie movie
            join movie.castMembers castMember
            where lower(castMember.name) = lower(:actorName)
            """)
    List<Movie> findAllByActorName(@Param("actorName") String actorName);
}
