package com.cinemabooking.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.MovieListEntry;

public interface MovieListEntryRepository extends JpaRepository<MovieListEntry, UUID> {
    List<MovieListEntry> findByCategoryOrderBySortOrderAsc(String category);

    void deleteByCategory(String category);

    void deleteByMovie_Id(UUID movieId);
}
