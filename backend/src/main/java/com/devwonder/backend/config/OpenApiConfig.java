package com.devwonder.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("4ThiTek API")
                        .version("v1")
                        .description("Documented API surface for admin, dealer, customer, and public clients.")
                        .contact(new Contact().name("4ThiTek")))
                .servers(List.of(
                        new Server().url("/api").description("Legacy API alias"),
                        new Server().url("/api/v1").description("Versioned API")
                ));
    }
}
