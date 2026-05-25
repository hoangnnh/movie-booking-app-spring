package com.cinemabooking.controller;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.CinemaResponse;
import com.cinemabooking.entity.Cinema;
import com.cinemabooking.repository.CinemaRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cinemas")
@RequiredArgsConstructor
public class CinemaController {

    private final CinemaRepository cinemaRepository;

    @GetMapping
    public List<CinemaResponse> getAllCinemas() {
        return cinemaRepository.findAllByOrderByBrandAscNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public CinemaResponse getCinemaById(@PathVariable UUID id) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cinema not found"));

        return toResponse(cinema);
    }

    private CinemaResponse toResponse(Cinema cinema) {
        return new CinemaResponse(
                cinema.getId(),
                cinema.getName(),
                cinema.getBrand(),
                cinema.getAddress(),
                cinema.getDistrict(),
                cinema.getCity(),
                cinema.getHotline(),
                cinema.getImageUrl(),
                splitAmenities(cinema.getAmenities())
        );
    }

    private List<String> splitAmenities(String amenities) {
        if (amenities == null || amenities.isBlank()) {
            return List.of();
        }

        return Arrays.stream(amenities.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }
}
