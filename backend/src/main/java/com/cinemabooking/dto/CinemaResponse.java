package com.cinemabooking.dto;

import java.util.List;
import java.util.UUID;

public record CinemaResponse(
        UUID id,
        String name,
        String brand,
        String address,
        String district,
        String city,
        String hotline,
        String imageUrl,
        List<String> amenities
) {
}
