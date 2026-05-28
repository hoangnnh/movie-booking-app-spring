package com.cinemabooking.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.Booking;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    List<Booking> findAllByOrderByCreatedAtDesc();

    Optional<Booking> findByPaymentReference(String paymentReference);

    long countByUser_Id(UUID userId);
}
