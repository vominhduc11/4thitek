package com.devwonder.backend;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

class RepositoryTextEncodingGuardTests {

    private static final List<Path> TEXT_ROOTS = List.of(
            Path.of("src/main"),
            Path.of("src/test"),
            Path.of("../main-fe/src"),
            Path.of("../admin-fe/src"),
            Path.of("../dealer/lib"),
            Path.of("../dealer/test")
    );

    private static final List<Path> TEXT_FILES = List.of(
            Path.of("../README.md"),
            Path.of("../.env.example"),
            Path.of("../.env.production.example"),
            Path.of("../docker-compose.yaml"),
            Path.of("../docker-compose.dev.yaml"),
            Path.of("../docker-compose.prod.yaml")
    );

    private static final List<String> TEXT_EXTENSIONS = List.of(
            ".java",
            ".properties",
            ".json",
            ".sql",
            ".md",
            ".ts",
            ".tsx",
            ".js",
            ".jsx",
            ".css",
            ".html",
            ".dart",
            ".arb",
            ".yaml",
            ".yml"
    );

    private static final Map<Path, List<String>> REQUIRED_VIETNAMESE_PHRASES = new LinkedHashMap<>();

    static {
        REQUIRED_VIETNAMESE_PHRASES.put(
                Path.of("src/main/resources/site-content.json"),
                List.of("79/30/52", "TP.", "info@4thitek.vn")
        );
        REQUIRED_VIETNAMESE_PHRASES.put(
                Path.of("../main-fe/src/lib/site.ts"),
                List.of("SITE_NAME", "REGISTERED_ADDRESS", "CONTACT_EMAIL")
        );
    }

    @Test
    void repositoryTextFilesRemainValidUtf8() throws IOException {
        List<String> violations = new ArrayList<>();

        for (Path root : TEXT_ROOTS) {
            if (!Files.exists(root)) {
                continue;
            }
            try (Stream<Path> stream = Files.walk(root)) {
                stream.filter(Files::isRegularFile)
                        .filter(this::isTextFile)
                        .sorted()
                        .forEach(path -> inspectFile(path, violations));
            }
        }

        for (Path file : TEXT_FILES) {
            if (Files.exists(file)) {
                inspectFile(file, violations);
            }
        }

        for (Map.Entry<Path, List<String>> entry : REQUIRED_VIETNAMESE_PHRASES.entrySet()) {
            Path path = entry.getKey();
            if (!Files.exists(path)) {
                continue;
            }

            String content = readUtf8(path, violations);
            if (content == null) {
                continue;
            }

            for (String phrase : entry.getValue()) {
                if (!content.contains(phrase)) {
                    violations.add(path + ": missing expected Vietnamese text \"" + phrase + "\".");
                }
            }
        }

        assertTrue(violations.isEmpty(), String.join(System.lineSeparator(), violations));
    }

    private boolean isTextFile(Path path) {
        String fileName = path.getFileName().toString().toLowerCase();
        for (String extension : TEXT_EXTENSIONS) {
            if (fileName.endsWith(extension)) {
                return true;
            }
        }
        return false;
    }

    private void inspectFile(Path path, List<String> violations) {
        String content = readUtf8(path, violations);
        if (content == null) {
            return;
        }

        int replacementCharacterIndex = content.indexOf('\uFFFD');
        if (replacementCharacterIndex >= 0) {
            violations.add(path + ": contains replacement character U+FFFD, likely from a broken encoding conversion.");
        }
    }

    private String readUtf8(Path path, List<String> violations) {
        try {
            byte[] bytes = Files.readAllBytes(path);
            return StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes))
                    .toString();
        } catch (CharacterCodingException exception) {
            violations.add(path + ": file is not valid UTF-8.");
            return null;
        } catch (IOException exception) {
            violations.add(path + ": failed to read file - " + exception.getMessage());
            return null;
        }
    }
}
