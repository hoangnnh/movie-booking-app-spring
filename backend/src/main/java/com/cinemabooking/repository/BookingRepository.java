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
    @EntityGraph(attributePaths = {
            "showtime",
            "showtime.movie",
            "showtime.room",
            "showtime.room.cinema"
    })
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

    @Query("""
            select booking.id from Booking booking
            where booking.status = :status
              and booking.paymentMethod = :paymentMethod
              and booking.createdAt < :cutoff
            """)
    List<UUID> findAbandonedPendingPaymentBookingIds(
            @Param("status") BookingStatus status,
            @Param("paymentMethod") String paymentMethod,
            @Param("cutoff") LocalDateTime cutoff
    );

    @Modifying
    @Query("""
            update Booking booking
            set booking.status = :expiredStatus,
                booking.paymentStatus = :failedPaymentStatus
            where booking.id in :bookingIds
            """)
    int markBookingsExpiredByIds(
            @Param("bookingIds") Collection<UUID> bookingIds,
            @Param("expiredStatus") BookingStatus expiredStatus,
            @Param("failedPaymentStatus") String failedPaymentStatus
    );

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
