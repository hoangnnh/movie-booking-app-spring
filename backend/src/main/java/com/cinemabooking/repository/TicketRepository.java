package com.cinemabooking.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.Ticket;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findByShowtime_Id(UUID showtimeId);

    List<Ticket> findByBooking_Id(UUID bookingId);

    boolean existsByShowtime_IdAndSeat_Id(UUID showtimeId, UUID seatId);
}