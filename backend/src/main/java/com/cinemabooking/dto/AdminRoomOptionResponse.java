package com.cinemabooking.dto;

import java.util.UUID;

public record AdminRoomOptionResponse(
        UUID id,
        String name,
        UUID cinemaId,
        String cinemaName
) {
}
