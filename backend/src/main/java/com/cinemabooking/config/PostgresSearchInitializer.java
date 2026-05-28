package com.cinemabooking.config;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@ConditionalOnProperty(name = "app.postgres-search.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class PostgresSearchInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        List<String> statements = List.of(
                "create extension if not exists pg_trgm",
                """
                create index if not exists idx_movies_search_vector
                on movies using gin (
                    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
                )
                """,
                """
                create index if not exists idx_movies_title_trgm
                on movies using gin (lower(title) gin_trgm_ops)
                """
        );

        statements.forEach(jdbcTemplate::execute);
    }
}
