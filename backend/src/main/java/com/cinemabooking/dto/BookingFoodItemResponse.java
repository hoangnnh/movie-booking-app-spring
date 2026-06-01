package com.cinemabooking.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BookingFoodItemResponse(
        UUID foodItemId,
        String name,
        BigDecimal unitPrice,
        int quantity,
        BigDecimal lineTotal
) {
}
