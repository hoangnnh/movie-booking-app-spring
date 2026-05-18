package com.cinemabooking.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.Cinema;

public interface CinemaRepository extends JpaRepository<Cinema, UUID> {
}