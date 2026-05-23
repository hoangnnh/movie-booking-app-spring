package com.cinemabooking.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.SeatStatusResponse;
import com.cinemabooking.dto.ShowtimeResponse;
import com.cinemabooking.entity.Showtime;
import com.cinemabooking.repository.ShowtimeRepository;
import com.cinemabooking.service.BookingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeRepository showtimeRepository;
    private final BookingService bookingService;

    @GetMapping("/movies/{movieId}/showtimes")
    public List<ShowtimeResponse> getShowtimesByMovie(@PathVariable UUID movieId) {
        return showtimeRepository.findByMovie_IdOrderByStartTimeAsc(movieId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/showtimes/{showtimeId}")
    public ShowtimeResponse getShowtimeById(@PathVariable UUID showtimeId) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime not found"));

        return toResponse(showtime);
    }

    @GetMapping("/showtimes/{showtimeId}/seats")
    public List<SeatStatusResponse> getSeatsByShowtime(@PathVariable UUID showtimeId) {
        return bookingService.getSeatStatuses(showtimeId);
    }

    private ShowtimeResponse toResponse(Showtime showtime) {
        return new ShowtimeResponse(
                showtime.getId(),
                showtime.getMovie().getId(),
                showtime.getMovie().getTitle(),
                showtime.getRoom().getId(),
                showtime.getRoom().getName(),
                showtime.getRoom().getCinema().getName(),
                showtime.getStartTime(),
                showtime.getEndTime(),
                showtime.getPrice()
        );
    }
}
