package com.example.MotvirsWeb.Security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class CaptchaService {

    private final RestTemplate restTemplate;

    @Value("${turnstile.secret-key}")
    private String secretKey;

    private static final String TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    public CaptchaService() {
        this.restTemplate = new RestTemplate();
    }

    public boolean isHuman(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("secret", secretKey);
        map.add("response", token);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

        try {
            ResponseEntity<TurnstileResponse> response = restTemplate.postForEntity(
                    TURNSTILE_VERIFY_URL, request, TurnstileResponse.class);

            TurnstileResponse body = response.getBody();
            return body != null && body.isSuccess();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
