package com.cinemabooking.controller;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinemabooking.dto.MovieAdvisorRequest;
import com.cinemabooking.dto.MovieAdvisorResponse;
import com.cinemabooking.service.MovieAdvisorService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAdvisorController {

    private final MovieAdvisorService movieAdvisorService;

    @PostMapping("/movie-advisor")
    public MovieAdvisorResponse advise(@Valid @RequestBody MovieAdvisorRequest request) {
        return movieAdvisorService.advise(request);
    }
}
