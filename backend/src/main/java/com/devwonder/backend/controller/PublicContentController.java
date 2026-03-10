package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.service.PublicContentService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/content", "/api/v1/content"})
@RequiredArgsConstructor
public class PublicContentController {

    private final PublicContentService publicContentService;

    @GetMapping("/{section}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSection(
            @PathVariable String section,
            @RequestParam(defaultValue = "vi") String lang
    ) {
        return ResponseEntity.ok(ApiResponse.success(publicContentService.getSection(section, lang)));
    }
}
