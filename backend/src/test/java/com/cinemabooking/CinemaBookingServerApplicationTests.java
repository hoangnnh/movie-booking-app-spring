package com.cinemabooking;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = "RESEND_API_KEY=test-resend-key")
@ActiveProfiles("test")
class CinemaBookingServerApplicationTests {

	@Autowired
	private Environment environment;

	@Test
	void contextLoads() {
	}

	@Test
	void usesStandardResendApiKeyEnvironmentVariable() {
		assertThat(environment.getProperty("app.email.resend.api-key"))
				.isEqualTo("test-resend-key");
	}

}
