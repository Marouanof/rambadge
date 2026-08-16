package ma.ram.sigba.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI sigbaOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Royal Air Maroc Badges — API Backend")
                        .description("""
                                Système d'Information Centralisé de Gestion des Badges Aéroportuaires
                                — Royal Air Maroc

                                API backend pour la gestion des demandes de badges, des habilitations
                                par zone, des incidents et de la traçabilité des accès aéroportuaires.
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("RAM Team")
                                .email("sigba@ram.ma"))
                        .license(new License()
                                .name("RAM Internal")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Keycloak JWT token. Obtenez-le via le endpoint de login Keycloak.")));
    }
}
