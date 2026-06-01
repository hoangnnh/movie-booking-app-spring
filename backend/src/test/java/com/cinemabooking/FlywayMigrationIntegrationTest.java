package com.cinemabooking;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(properties = "RESEND_API_KEY=test-resend-key")
@ActiveProfiles("flyway-it")
@Testcontainers(disabledWithoutDocker = true)
class FlywayMigrationIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("movie_booking_app")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void registerDataSourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private DataSource dataSource;

    @Test
    void flywayAppliesMigrationsAndSchemaMatchesEntities() {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

        Integer latestMigration = jdbcTemplate.queryForObject(
                "select max(version) from flyway_schema_history where success = true",
                Integer.class
        );
        assertThat(latestMigration).isGreaterThanOrEqualTo(15);

        Integer usersTableCount = jdbcTemplate.queryForObject(
                """
                select count(*)
                from information_schema.tables
                where table_schema = 'public' and table_name = 'users'
                """,
                Integer.class
        );
        assertThat(usersTableCount).isEqualTo(1);

        Integer foodItemsTableCount = jdbcTemplate.queryForObject(
                """
                select count(*)
                from information_schema.tables
                where table_schema = 'public' and table_name = 'food_items'
                """,
                Integer.class
        );
        assertThat(foodItemsTableCount).isEqualTo(1);

        Integer verificationExpiryColumnCount = jdbcTemplate.queryForObject(
                """
                select count(*)
                from information_schema.columns
                where table_schema = 'public'
                  and table_name = 'users'
                  and column_name = 'verification_token_expiry'
                """,
                Integer.class
        );
        assertThat(verificationExpiryColumnCount).isEqualTo(1);
    }
}
