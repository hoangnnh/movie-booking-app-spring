package com.cinemabooking.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.cinemabooking.entity.AppUser;
import com.cinemabooking.enums.AuthProvider;
import com.cinemabooking.enums.Role;
import com.cinemabooking.repository.AppUserRepository;

@Component
@ConditionalOnProperty(name = "app.seed.dummy-users.enabled", havingValue = "true")
public class DummyUserSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DummyUserSeeder.class);

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final String credentialFile;

    public DummyUserSeeder(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed.dummy-users.file:}") String credentialFile
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.credentialFile = credentialFile;
    }

    @Override
    public void run(String... args) throws IOException {
        if (!StringUtils.hasText(credentialFile)) {
            throw new IllegalStateException(
                    "APP_SEED_DUMMY_USERS_FILE is required when dummy-user seeding is enabled");
        }

        Path path = Path.of(credentialFile);
        if (!Files.isRegularFile(path)) {
            throw new IllegalStateException("Dummy-user credential file was not found: " + path);
        }

        int created = 0;
        int skipped = 0;
        int lineNumber = 0;

        for (String line : Files.readAllLines(path, StandardCharsets.UTF_8)) {
            lineNumber++;

            if (lineNumber == 1 && line.trim().equalsIgnoreCase("email,password")) {
                continue;
            }

            if (line.isBlank()) {
                continue;
            }

            String[] fields = line.split(",", -1);
            if (fields.length != 2) {
                throw invalidRow(lineNumber);
            }

            String email = fields[0].trim().toLowerCase(Locale.ROOT);
            String password = fields[1].trim();
            if (!email.matches("[^.@]+\\.[^.@]+@[^@]+") || password.isBlank()) {
                throw invalidRow(lineNumber);
            }

            if (appUserRepository.findByEmail(email).isPresent()) {
                skipped++;
                continue;
            }

            AppUser user = new AppUser();
            user.setFullName(displayNameFromEmail(email));
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(Role.USER);
            user.setProvider(AuthProvider.LOCAL);
            user.setEmailVerified(true);
            appUserRepository.save(user);
            created++;
        }

        log.info("Dummy-user seed completed. Created: {}, skipped existing: {}", created, skipped);
    }

    private IllegalArgumentException invalidRow(int lineNumber) {
        return new IllegalArgumentException(
                "Invalid dummy-user credential row " + lineNumber + ". Expected email,password.");
    }

    private String displayNameFromEmail(String email) {
        String localPart = email.substring(0, email.indexOf('@'));
        String[] nameParts = localPart.split("\\.");
        return capitalizeWords(nameParts[0]) + " " + capitalizeWords(nameParts[1]);
    }

    private String capitalizeWords(String value) {
        String[] words = value.split("[-_]");
        StringBuilder result = new StringBuilder();

        for (String word : words) {
            if (word.isBlank()) {
                continue;
            }

            if (!result.isEmpty()) {
                result.append(' ');
            }

            result.append(Character.toUpperCase(word.charAt(0)));
            result.append(word.substring(1).toLowerCase(Locale.ROOT));
        }

        return result.toString();
    }
}
