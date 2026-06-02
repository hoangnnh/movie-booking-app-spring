package com.cinemabooking.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.FoodItemResponse;
import com.cinemabooking.repository.FoodItemRepository;
import com.cinemabooking.repository.ShowtimeRepository;
import com.cinemabooking.service.ShowtimeAvailabilityService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
public class FoodItemController {

    private final ShowtimeRepository showtimeRepository;
    private final FoodItemRepository foodItemRepository;
    private final ShowtimeAvailabilityService showtimeAvailabilityService;

    @GetMapping("/{showtimeId}/food-items")
    public List<FoodItemResponse> getFoodItems(@PathVariable UUID showtimeId) {
        showtimeAvailabilityService.requireBookable(
                showtimeRepository.findById(showtimeId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime not found"))
        );

        return foodItemRepository.findByActiveTrueOrderBySortOrderAscNameAsc()
                .stream()
                .map(item -> new FoodItemResponse(
                        item.getId(),
                        item.getSlug(),
                        item.getName(),
                        item.getDescription(),
                        item.getCategory(),
                        item.getPrice(),
                        item.getImageUrl()
                ))
                .toList();
    }
}
