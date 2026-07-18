package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.config.KeycloakConfig;
import ma.ram.sigba.exception.BusinessException;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakService {

    private final KeycloakConfig keycloakConfig;
    private final RestClient restClient = RestClient.create();

    public void creerUtilisateur(String email, String nom, String prenom, String matricule, String role) {
        String adminToken = getAdminAccessToken();

        Map<String, Object> userRepresentation = Map.of(
                "username", email,
                "email", email,
                "firstName", prenom,
                "lastName", nom,
                "enabled", true,
                "emailVerified", true,
                "attributes", Map.of("matricule", List.of(matricule)),
                "realmRoles", List.of(role)
        );

        String usersUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm()
                + "/users";

        try {
            restClient.post()
                    .uri(usersUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(userRepresentation)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Utilisateur Keycloak créé : {} {} ({})", prenom, nom, email);
        } catch (Exception e) {
            log.error("Erreur lors de la création Keycloak pour {}: {}", email, e.getMessage());
            throw new BusinessException("Erreur lors de la création du compte Keycloak : " + e.getMessage());
        }
    }

    public void envoyerEmailActivation(String email) {
        String adminToken = getAdminAccessToken();

        String usersUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm()
                + "/users";

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> users = restClient.get()
                    .uri(usersUrl + "?email={email}", email)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .retrieve()
                    .body(List.class);

            String userId = users.stream()
                    .findFirst()
                    .map(obj -> (String) obj.get("id"))
                    .orElseThrow(() -> new BusinessException("Utilisateur Keycloak non trouvé : " + email));

            String executeActionsUrl = usersUrl + "/" + userId + "/execute-actions-email"
                    + "?client_id=" + keycloakConfig.getClientId()
                    + "&redirect_uri=http://localhost:3000";

            restClient.post()
                    .uri(executeActionsUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(List.of("UPDATE_PASSWORD"))
                    .retrieve()
                    .toBodilessEntity();

            log.info("Email d'activation envoyé à {}", email);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email d'activation à {}: {}", email, e.getMessage());
            throw new BusinessException("Erreur lors de l'envoi de l'email d'activation : " + e.getMessage());
        }
    }

    public void supprimerUtilisateur(String email) {
        String adminToken = getAdminAccessToken();

        String usersUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm()
                + "/users";

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> users = restClient.get()
                    .uri(usersUrl + "?email={email}", email)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .retrieve()
                    .body(List.class);

            String userId = users.stream()
                    .findFirst()
                    .map(obj -> (String) obj.get("id"))
                    .orElse(null);

            if (userId != null) {
                restClient.delete()
                        .uri(usersUrl + "/" + userId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .retrieve()
                        .toBodilessEntity();
                log.info("Utilisateur Keycloak supprimé : {}", email);
            }
        } catch (Exception e) {
            log.error("Erreur lors de la suppression Keycloak pour {}: {}", email, e.getMessage());
        }
    }

    private String getAdminAccessToken() {
        String tokenUrl = keycloakConfig.getServerUrl()
                + "/realms/master/protocol/openid-connect/token";

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", "admin-cli");
        body.add("username", keycloakConfig.getUsername());
        body.add("password", keycloakConfig.getPassword());

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(tokenUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            return response.get("access_token").toString();
        } catch (Exception e) {
            log.error("Erreur lors de l'obtention du token admin Keycloak: {}", e.getMessage());
            throw new BusinessException("Erreur de connexion à Keycloak");
        }
    }
}
