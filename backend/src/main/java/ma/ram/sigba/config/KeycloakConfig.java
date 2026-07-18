package ma.ram.sigba.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "keycloak.admin")
@Getter
@Setter
public class KeycloakConfig {

    private String serverUrl = "http://localhost:8080";
    private String realm = "sigba-realm";
    private String clientId = "sigba-backend";
    private String clientSecret = "";
    private String username = "admin";
    private String password = "admin";
}
