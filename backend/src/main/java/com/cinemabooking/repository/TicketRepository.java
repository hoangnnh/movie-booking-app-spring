package com.cinemabooking.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.Ticket;
import com.cinemabooking.enums.BookingStatus;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findByShowtime_Id(UUID showtimeId);

    List<Ticket> findByShowtime_IdAndBooking_StatusIn(UUID showtimeId, Collection<BookingStatus> statuses);

    List<Ticket> findByBooking_Id(UUID bookingId);

    boolean existsByShowtime_IdAndSeat_Id(UUID showtimeId, UUID seatId);

    boolean existsByShowtime_IdAndSeat_IdAndBooking_StatusIn(
            UUID showtimeId,
            UUID seatId,
            Collection<BookingStatus> statuses
    );

    void deleteByBooking_Id(UUID bookingId);

    long countByShowtime_Movie_Id(UUID movieId);
}
