package com.devwonder.backend.controller;

import com.devwonder.backend.dto.webhook.SepayWebhookRequest;
import com.devwonder.backend.service.SepayService;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/webhooks/sepay")
@RequiredArgsConstructor
public class SepayWebhookController {

    private final SepayService sepayService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> receiveWebhook(
            @RequestBody SepayWebhookRequest request,
            @RequestHeader(name = "X-Webhook-Token", required = false) String headerToken
    ) {
        SepayService.WebhookResult result = sepayService.processWebhook(request, headerToken);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("status", result.status());
        body.put("orderCode", result.orderCode());
        body.put("transactionCode", result.transactionCode());
        body.put("message", result.message());
        return ResponseEntity.ok(body);
    }
}
