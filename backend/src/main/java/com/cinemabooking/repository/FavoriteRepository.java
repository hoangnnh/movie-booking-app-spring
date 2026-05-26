package com.cinemabooking.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.Favorite;

public interface FavoriteRepository extends JpaRepository<Favorite, UUID> {
    List<Favorite> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    boolean existsByUser_IdAndMovie_Id(UUID userId, UUID movieId);

    Optional<Favorite> findByUser_IdAndMovie_Id(UUID userId, UUID movieId);

    void deleteByMovie_Id(UUID movieId);

    void deleteByUser_Id(UUID userId);
}
