package com.cinemabooking.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.Room;

public interface RoomRepository extends JpaRepository<Room, UUID> {
    List<Room> findByCinema_IdOrderByNameAsc(UUID cinemaId);
}
