package com.cinemabooking.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.Showtime;

public interface ShowtimeRepository extends JpaRepository<Showtime, UUID> {
    List<Showtime> findByMovie_IdOrderByStartTimeAsc(UUID movieId);

    boolean existsByMovie_IdAndRoom_IdAndStartTimeBetween(
            UUID movieId,
            UUID roomId,
            LocalDateTime startTime,
            LocalDateTime endTime
    );
}
