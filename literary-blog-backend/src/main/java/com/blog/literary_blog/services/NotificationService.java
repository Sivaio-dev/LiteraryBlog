package com.blog.literary_blog.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class NotificationService {

    @Value("${onesignal.app.id}")
    private String appId;

    @Value("${onesignal.rest.api.key}")
    private String restApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void sendNewPostNotification(String title, String slug) {
        String url = "https://onesignal.com/api/v1/notifications";

        // Build the payload
        Map<String, Object> payload = new HashMap<>();
        payload.put("app_id", appId);
        payload.put("included_segments", Collections.singletonList("Total Subscriptions"));
        payload.put("headings", Map.of("en", "New Post: " + title));
        payload.put("contents", Map.of("en", "A new literary piece is available to read."));
        payload.put("url", "https://kesavthoughts.vercel.app/#/blog/" + slug);
        payload.put("web_buttons", Collections.singletonList(
                Map.of("id", "read", "text", "Read Now", "url", "https://kesavthoughts.vercel.app/#/blog/" + slug)
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + restApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ Notification sent successfully!");
            } else {
                System.err.println("❌ Failed to send notification: " + response.getBody());
            }
        } catch (Exception e) {
            System.err.println("❌ Error sending notification: " + e.getMessage());
        }
    }
}
