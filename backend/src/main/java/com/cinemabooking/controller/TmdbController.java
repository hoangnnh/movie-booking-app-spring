package com.cinemabooking.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cinemabooking.dto.MovieResponse;
import com.cinemabooking.dto.TmdbImportResponse;
import com.cinemabooking.dto.TmdbSearchResponse;
import com.cinemabooking.service.TmdbService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tmdb")
@RequiredArgsConstructor
public class TmdbController {

    private final TmdbService tmdbService;

    @GetMapping("/movies/search")
    public TmdbSearchResponse searchMovies(@RequestParam String query) {
        return tmdbService.searchMovies(query);
    }

    @PostMapping("/movies/{tmdbId}/import")
    public MovieResponse importMovie(@PathVariable Integer tmdbId) {
        return tmdbService.importMovie(tmdbId);
    }

    @PostMapping("/movies/import")
    public TmdbImportResponse importMoviesByList(
            @RequestParam(defaultValue = "now_playing") String list,
            @RequestParam(defaultValue = "1") int pages
    ) {
        return tmdbService.importMoviesByList(list, pages);
    }
}
