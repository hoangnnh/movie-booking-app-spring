package com.cinemabooking.dto;

import java.util.List;
import java.util.UUID;

public record AdminBulkDeleteRequest(
        List<UUID> ids,
        String password
) {
}
