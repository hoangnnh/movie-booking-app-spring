package com.cinemabooking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class MovieSearchQueryFormatterTests {

    @Test
    void buildsPrefixTsQueryFromMultipleTokens() {
        assertEquals("star:* & war:*", MovieSearchQueryFormatter.buildPrefixTsQuery(" Star   War "));
    }

    @Test
    void escapesWildcardsInLikePattern() {
        assertEquals("100\\%\\_real%", MovieSearchQueryFormatter.buildPrefixLikePattern("100%_real"));
    }
}
