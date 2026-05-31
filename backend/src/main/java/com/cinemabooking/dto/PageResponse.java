package com.cinemabooking.dto;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

public record PageResponse<T>(
        List<T> items,
        long totalItems,
        int totalPages,
        int page,
        int size
) {
    public static <S, T> PageResponse<T> from(Page<S> source, Function<S, T> mapper) {
        return new PageResponse<>(
                source.getContent().stream().map(mapper).toList(),
                source.getTotalElements(),
                source.getTotalPages(),
                source.getNumber(),
                source.getSize()
        );
    }
}
