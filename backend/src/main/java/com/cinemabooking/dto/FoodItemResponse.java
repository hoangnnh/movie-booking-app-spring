package com.cinemabooking.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record FoodItemResponse(
        UUID id,
        String slug,
        String name,
        String description,
        String category,
        BigDecimal price,
        String imageUrl
) {
}
