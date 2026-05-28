package com.cinemabooking.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cinemabooking.entity.Movie;
import com.cinemabooking.entity.Room;
import com.cinemabooking.entity.Seat;
import com.cinemabooking.entity.Showtime;
import com.cinemabooking.repository.RoomRepository;
import com.cinemabooking.repository.SeatRepository;
import com.cinemabooking.repository.ShowtimeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShowtimeSeedService {

    private static final List<LocalTime> START_TIMES = List.of(
            LocalTime.of(10, 30),
            LocalTime.of(13, 20),
            LocalTime.of(16, 10),
            LocalTime.of(19, 0),
            LocalTime.of(21, 45)
    );

    private final RoomRepository roomRepository;
    private final SeatRepository seatRepository;
    private final ShowtimeRepository showtimeRepository;

    @Value("${app.seed.showtimes.slots-per-movie:3}")
    private int slotsPerMovie;

    @Transactional
    public void createShowtimesForMovieIfMissing(Movie movie) {
        if (movie == null || movie.getId() == null) {
            return;
        }

        if (showtimeRepository.countByMovie_Id(movie.getId()) > 0) {
            return;
        }

        List<Room> rooms = roomRepository.findAll()
                .stream()
                .limit(Math.max(1, slotsPerMovie))
                .toList();

        int createdCount = 0;

        for (int roomIndex = 0; roomIndex < rooms.size() && createdCount < slotsPerMovie; roomIndex++) {
            Room room = rooms.get(roomIndex);
            ensureSeats(room);

            for (int dayOffset = 0; dayOffset < 14 && createdCount < slotsPerMovie; dayOffset++) {
                LocalDate date = LocalDate.now().plusDays(dayOffset);
                LocalTime startTime = START_TIMES.get((roomIndex + dayOffset) % START_TIMES.size());

                Showtime showtime = new Showtime();
                showtime.setMovie(movie);
                showtime.setRoom(room);
                showtime.setStartTime(LocalDateTime.of(date, startTime));
                showtime.setEndTime(showtime.getStartTime().plusMinutes(movie.getDurationMinutes()));
                showtime.setPrice(priceForRoom(roomIndex));
                showtimeRepository.save(showtime);
                createdCount++;
            }
        }
    }

    public void ensureSeats(Room room) {
        if (!seatRepository.findByRoom_IdOrderByRowNameAscSeatNumberAsc(room.getId()).isEmpty()) {
            return;
        }

        for (String row : List.of("A", "B", "C", "D", "E", "F")) {
            for (int number = 1; number <= 10; number++) {
                Seat seat = new Seat();
                seat.setRoom(room);
                seat.setRowName(row);
                seat.setSeatNumber(number);
                seatRepository.save(seat);
            }
        }
    }

    private BigDecimal priceForRoom(int roomIndex) {
        return BigDecimal.valueOf(75000 + (long) (roomIndex % 4) * 10000);
    }
}
