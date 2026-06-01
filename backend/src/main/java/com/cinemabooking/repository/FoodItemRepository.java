package com.cinemabooking.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.FoodItem;

public interface FoodItemRepository extends JpaRepository<FoodItem, UUID> {

    List<FoodItem> findByActiveTrueOrderBySortOrderAscNameAsc();

    List<FoodItem> findByIdInAndActiveTrue(Collection<UUID> ids);

    Optional<FoodItem> findBySlug(String slug);
}
