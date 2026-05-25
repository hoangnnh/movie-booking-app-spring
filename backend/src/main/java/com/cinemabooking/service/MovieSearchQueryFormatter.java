package com.cinemabooking.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class MovieSearchQueryFormatter {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("[\\p{L}\\p{N}]+");

    private MovieSearchQueryFormatter() {
    }

    public static String buildPrefixTsQuery(String rawQuery) {
        if (rawQuery == null || rawQuery.isBlank()) {
            return "";
        }

        List<String> tokens = new ArrayList<>();
        Matcher matcher = TOKEN_PATTERN.matcher(rawQuery.toLowerCase(Locale.ROOT));

        while (matcher.find()) {
            tokens.add(matcher.group() + ":*");
        }

        return String.join(" & ", tokens);
    }

    public static String buildPrefixLikePattern(String rawQuery) {
        String normalized = rawQuery == null ? "" : rawQuery.trim().toLowerCase(Locale.ROOT);
        return escapeLikeValue(normalized) + "%";
    }

    private static String escapeLikeValue(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
