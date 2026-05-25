package com.cinemabooking.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.FavoriteStatusResponse;
import com.cinemabooking.dto.MovieResponse;
import com.cinemabooking.entity.AppUser;
import com.cinemabooking.entity.Favorite;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.repository.AppUserRepository;
import com.cinemabooking.repository.FavoriteRepository;
import com.cinemabooking.repository.MovieRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final AppUserRepository appUserRepository;
    private final MovieRepository movieRepository;
    private final FavoriteRepository favoriteRepository;
    private final TmdbService tmdbService;

    @Transactional(readOnly = true)
    public List<MovieResponse> getFavorites(UUID authenticatedUserId, UUID userId) {
        assertCanAccessFavorites(authenticatedUserId, userId);

        return favoriteRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(Favorite::getMovie)
                .map(tmdbService::toStoredMovieResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FavoriteStatusResponse getFavoriteStatus(UUID authenticatedUserId, UUID userId, UUID movieId) {
        assertCanAccessFavorites(authenticatedUserId, userId);
        return new FavoriteStatusResponse(favoriteRepository.existsByUser_IdAndMovie_Id(userId, movieId));
    }

    @Transactional
    public FavoriteStatusResponse addFavorite(UUID authenticatedUserId, UUID userId, UUID movieId) {
        assertCanAccessFavorites(authenticatedUserId, userId);

        if (favoriteRepository.existsByUser_IdAndMovie_Id(userId, movieId)) {
            return new FavoriteStatusResponse(true);
        }

        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));

        Favorite favorite = new Favorite();
        favorite.setUser(user);
        favorite.setMovie(movie);
        favoriteRepository.save(favorite);

        return new FavoriteStatusResponse(true);
    }

    @Transactional
    public FavoriteStatusResponse removeFavorite(UUID authenticatedUserId, UUID userId, UUID movieId) {
        assertCanAccessFavorites(authenticatedUserId, userId);

        favoriteRepository.findByUser_IdAndMovie_Id(userId, movieId)
                .ifPresent(favoriteRepository::delete);

        return new FavoriteStatusResponse(false);
    }

    private void assertCanAccessFavorites(UUID authenticatedUserId, UUID userId) {
        if (!authenticatedUserId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own favorites");
        }
    }
}
