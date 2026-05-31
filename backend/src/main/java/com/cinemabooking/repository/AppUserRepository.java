package com.cinemabooking.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinemabooking.entity.AppUser;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByVerificationToken(String token);
    Optional<AppUser> findByResetPasswordToken(String token);

    List<AppUser> findTop5ByOrderByCreatedAtDesc();
}
