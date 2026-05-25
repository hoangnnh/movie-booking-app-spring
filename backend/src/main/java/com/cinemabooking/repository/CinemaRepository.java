package com.cinemabooking.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.Cinema;

public interface CinemaRepository extends JpaRepository<Cinema, UUID> {
    boolean existsByName(String name);

    List<Cinema> findAllByOrderByBrandAscNameAsc();
}
