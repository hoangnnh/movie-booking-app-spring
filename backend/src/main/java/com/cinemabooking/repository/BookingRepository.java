package com.cinemabooking.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

import com.cinemabooking.entity.Booking;
import com.cinemabooking.enums.BookingStatus;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    @EntityGraph(attributePaths = {
            "user",
            "showtime",
            "showtime.movie",
            "showtime.room",
            "showtime.room.cinema"
    })
    Page<Booking> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {
            "user",
            "showtime",
            "showtime.movie",
            "showtime.room",
            "showtime.room.cinema"
    })
    List<Booking> findTop5ByOrderByCreatedAtDesc();

    Optional<Booking> findByPaymentReference(String paymentReference);

    long countByUser_Id(UUID userId);

    @Query("select coalesce(sum(booking.totalAmount), 0) from Booking booking where booking.status = :status")
    BigDecimal sumTotalAmountByStatus(@Param("status") BookingStatus status);

    @Modifying
    @Query("""
            update Booking booking
            set booking.status = :expiredStatus
            where booking.status in :activeStatuses
              and booking.showtime.startTime < :now
            """)
    int expirePassedShowtimeBookings(
            @Param("activeStatuses") Collection<BookingStatus> activeStatuses,
            @Param("expiredStatus") BookingStatus expiredStatus,
            @Param("now") LocalDateTime now
    );
}
