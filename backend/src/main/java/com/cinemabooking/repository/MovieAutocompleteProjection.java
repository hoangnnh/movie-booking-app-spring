package com.cinemabooking.repository;

import java.time.LocalDate;
import java.util.UUID;

public interface MovieAutocompleteProjection {
    UUID getId();

    String getTitle();

    String getPosterUrl();

    LocalDate getReleaseDate();
}
