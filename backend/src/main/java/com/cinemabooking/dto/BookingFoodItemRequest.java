package com.cinemabooking.dto;

import java.util.UUID;

public record BookingFoodItemRequest(
        UUID foodItemId,
        Integer quantity
) {
}
