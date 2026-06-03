package com.cinemabooking.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.MovieReview;

public interface MovieReviewRepository extends JpaRepository<MovieReview, UUID> {

    List<MovieReview> findByMovie_IdOrderByCreatedAtDesc(UUID movieId);

    Optional<MovieReview> findByMovie_IdAndUser_Id(UUID movieId, UUID userId);
}
