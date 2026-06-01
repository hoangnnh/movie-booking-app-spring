package com.cinemabooking.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.cinemabooking.entity.AppUser;
import com.cinemabooking.enums.AuthProvider;
import com.cinemabooking.enums.Role;
import com.cinemabooking.repository.AppUserRepository;

@ExtendWith(MockitoExtension.class)
class DummyUserSeederTests {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @TempDir
    private Path tempDir;

    @Test
    void seedsVerifiedUserWithDerivedNameAndEncodedPassword() throws Exception {
        Path credentials = tempDir.resolve("dummy-users.csv");
        Files.writeString(credentials, "email,password\njohn.doe-smith@example.com,123456\n");
        when(appUserRepository.findByEmail("john.doe-smith@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("123456")).thenReturn("encoded-password");

        new DummyUserSeeder(appUserRepository, passwordEncoder, credentials.toString()).run();

        ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
        verify(appUserRepository).save(userCaptor.capture());

        AppUser user = userCaptor.getValue();
        assertThat(user.getFullName()).isEqualTo("John Doe Smith");
        assertThat(user.getEmail()).isEqualTo("john.doe-smith@example.com");
        assertThat(user.getPassword()).isEqualTo("encoded-password");
        assertThat(user.getRole()).isEqualTo(Role.USER);
        assertThat(user.getProvider()).isEqualTo(AuthProvider.LOCAL);
        assertThat(user.isEmailVerified()).isTrue();
    }

    @Test
    void skipsExistingUserWithoutReencodingPassword() throws Exception {
        Path credentials = tempDir.resolve("dummy-users.csv");
        Files.writeString(credentials, "email,password\njohn.doe@example.com,123456\n");
        when(appUserRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(new AppUser()));

        new DummyUserSeeder(appUserRepository, passwordEncoder, credentials.toString()).run();

        verify(appUserRepository).findByEmail("john.doe@example.com");
        verify(passwordEncoder, org.mockito.Mockito.never()).encode(any());
        verify(appUserRepository, org.mockito.Mockito.never()).save(any());
    }
}
