package com.cinemabooking.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.Room;

public interface RoomRepository extends JpaRepository<Room, UUID> {
}