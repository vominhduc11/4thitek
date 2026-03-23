package com.devwonder.backend.dto.dealer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterPushTokenRequest(
        @NotBlank(message = "token is required")
        @Size(max = 512, message = "token must be at most 512 characters")
        String token,
        @NotBlank(message = "platform is required")
        @Pattern(regexp = "ANDROID|IOS", message = "platform must be ANDROID or IOS")
        String platform,
        @Size(max = 120, message = "deviceName must be at most 120 characters")
        String deviceName,
        @Size(max = 40, message = "appVersion must be at most 40 characters")
        String appVersion,
        @Size(max = 12, message = "languageCode must be at most 12 characters")
        String languageCode
) {
}
