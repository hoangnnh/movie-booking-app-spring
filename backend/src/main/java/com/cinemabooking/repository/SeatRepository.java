package com.cinemabooking.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.Seat;

public interface SeatRepository extends JpaRepository<Seat, UUID> {
    List<Seat> findByRoom_IdOrderByRowNameAscSeatNumberAsc(UUID roomId);
}