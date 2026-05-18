package com.cinemabooking.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.Genre;

public interface GenreRepository extends JpaRepository<Genre, UUID> {
    Optional<Genre> findByName(String name);
}