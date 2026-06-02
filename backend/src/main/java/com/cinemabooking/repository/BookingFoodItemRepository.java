package com.cinemabooking.repository;

import java.util.List;
import java.util.Collection;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.BookingFoodItem;

public interface BookingFoodItemRepository extends JpaRepository<BookingFoodItem, UUID> {

    List<BookingFoodItem> findByBooking_IdOrderByCreatedAtAsc(UUID bookingId);

    List<BookingFoodItem> findByBooking_IdInOrderByCreatedAtAsc(Collection<UUID> bookingIds);

    void deleteByBooking_Id(UUID bookingId);
}
