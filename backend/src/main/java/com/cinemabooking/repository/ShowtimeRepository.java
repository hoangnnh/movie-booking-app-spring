package com.cinemabooking.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cinemabooking.entity.Showtime;

public interface ShowtimeRepository extends JpaRepository<Showtime, UUID> {
    @EntityGraph(attributePaths = {"movie", "room", "room.cinema"})
    Page<Showtime> findAllByOrderByStartTimeDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"movie", "room", "room.cinema"})
    @Query("""
            select showtime
            from Showtime showtime
            where (:movieFilterDisabled = true or showtime.movie.id = :movieId)
              and (:cinemaFilterDisabled = true or showtime.room.cinema.id = :cinemaId)
              and (:roomFilterDisabled = true or showtime.room.id = :roomId)
              and (:fromFilterDisabled = true or showtime.startTime >= :fromTime)
              and (:toFilterDisabled = true or showtime.startTime <= :toTime)
              and (:includeExpired = true or showtime.startTime >= current_timestamp)
            order by showtime.startTime asc, showtime.room.cinema.name asc, showtime.room.name asc, showtime.movie.title asc
            """)
    Page<Showtime> findAdminShowtimes(
            @Param("movieId") UUID movieId,
            @Param("movieFilterDisabled") boolean movieFilterDisabled,
            @Param("cinemaId") UUID cinemaId,
            @Param("cinemaFilterDisabled") boolean cinemaFilterDisabled,
            @Param("roomId") UUID roomId,
            @Param("roomFilterDisabled") boolean roomFilterDisabled,
            @Param("fromTime") LocalDateTime fromTime,
            @Param("fromFilterDisabled") boolean fromFilterDisabled,
            @Param("toTime") LocalDateTime toTime,
            @Param("toFilterDisabled") boolean toFilterDisabled,
            @Param("includeExpired") boolean includeExpired,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"movie", "room", "room.cinema"})
    List<Showtime> findTop5ByOrderByStartTimeDesc();

    List<Showtime> findByMovie_IdOrderByStartTimeAsc(UUID movieId);

    long countByMovie_Id(UUID movieId);

    void deleteByMovie_Id(UUID movieId);

    boolean existsByMovie_IdAndRoom_IdAndStartTimeBetween(
            UUID movieId,
            UUID roomId,
            LocalDateTime startTime,
            LocalDateTime endTime
    );

    @Query("""
            select count(showtime)
            from Showtime showtime
            where showtime.room.id = :roomId
              and showtime.id <> :excludedShowtimeId
              and showtime.startTime < :endTime
              and showtime.endTime > :startTime
            """)
    long countOverlappingRoomShowtimes(
            @Param("roomId") UUID roomId,
            @Param("excludedShowtimeId") UUID excludedShowtimeId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Modifying
    @Query("""
            delete from Showtime showtime
            where showtime.startTime < :before
              and not exists (
                  select ticket.id
                  from Ticket ticket
                  where ticket.showtime = showtime
              )
            """)
    int deleteExpiredUnbookedShowtimes(@Param("before") LocalDateTime before);
}
