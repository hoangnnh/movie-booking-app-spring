package com.cinemabooking.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cinemabooking.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findTop20ByUser_IdOrderByCreatedAtDesc(UUID userId);

    long countByUser_IdAndReadFalse(UUID userId);

    Optional<Notification> findByIdAndUser_Id(UUID notificationId, UUID userId);

    @Modifying
    @Query("""
            update Notification notification
            set notification.read = true
            where notification.user.id = :userId
              and notification.read = false
            """)
    int markAllReadByUserId(@Param("userId") UUID userId);
}
