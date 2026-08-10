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
        String realmUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm();

        Map<String, Object> userRepresentation = Map.of(
                "username", email,
                "email", email,
                "firstName", prenom,
                "lastName", nom,
                "enabled", true,
                "emailVerified", true,
                "attributes", Map.of("matricule", List.of(matricule))
        );

        String usersUrl = realmUrl + "/users";

        try {
            restClient.post()
                    .uri(usersUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(userRepresentation)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Utilisateur Keycloak créé : {} {} ({})", prenom, nom, email);

            assignerRoleRealm(adminToken, realmUrl, email, role);

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erreur lors de la création Keycloak pour {}: {}", email, e.getMessage());
            throw new BusinessException("Erreur lors de la création du compte Keycloak : " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private void assignerRoleRealm(String adminToken, String realmUrl, String email, String role) {
        String usersUrl = realmUrl + "/users";

        List<Map<String, Object>> users = restClient.get()
                .uri(usersUrl + "?email={email}", email)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .retrieve()
                .body(List.class);

        String userId = users.stream()
                .findFirst()
                .map(obj -> (String) obj.get("id"))
                .orElseThrow(() -> new BusinessException("Utilisateur Keycloak non trouvé : " + email));

        List<Map<String, Object>> realmRoles = restClient.get()
                .uri(realmUrl + "/roles")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .retrieve()
                .body(List.class);

        Map<String, Object> roleObj = realmRoles.stream()
                .filter(r -> role.equals(r.get("name")))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Rôle Keycloak non trouvé : " + role));

        restClient.post()
                .uri(usersUrl + "/" + userId + "/role-mappings/realm")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(List.of(roleObj))
                .retrieve()
                .toBodilessEntity();

        log.info("Rôle '{}' assigné à {} dans Keycloak", role, email);
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
                    + "?client_id=sigba-frontend"
                    + "&redirect_uri=http://localhost:5173";

            restClient.method(HttpMethod.PUT)
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

    public void desactiverUtilisateur(String email) {
        changerActivation(email, false);
    }

    public void activerUtilisateur(String email) {
        changerActivation(email, true);
    }

    @SuppressWarnings("unchecked")
    private void changerActivation(String email, boolean enabled) {
        String adminToken = getAdminAccessToken();
        String userId = trouverUserIdParEmail(adminToken, email);
        String userUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm()
                + "/users/" + userId;

        try {
            Map<String, Object> userRepresentation = restClient.get()
                    .uri(userUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .retrieve()
                    .body(Map.class);

            userRepresentation.put("enabled", enabled);

            restClient.put()
                    .uri(userUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(userRepresentation)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Utilisateur Keycloak {} : enabled={}", email, enabled);

            if (!enabled) {
                deconnecterUtilisateur(email);
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erreur lors de la modification de l'activation du compte Keycloak {}: {}", email, e.getMessage());
            throw new BusinessException("Erreur lors de la modification de l'activation du compte : " + e.getMessage());
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

    public boolean utilisateurExiste(String email) {
        String adminToken = getAdminAccessToken();
        String usersUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm()
                + "/users?email=" + email;

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> users = restClient.get()
                    .uri(usersUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .retrieve()
                    .body(List.class);

            return users != null && !users.isEmpty();
        } catch (Exception e) {
            log.error("Erreur lors de la vérification de l'utilisateur Keycloak {}: {}", email, e.getMessage());
            return false;
        }
    }

    public void envoyerEmailReinitialisationMotDePasse(String email) {
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
                    .orElseThrow(() -> new BusinessException("Aucun compte trouvé avec l'email : " + email));

            String executeActionsUrl = usersUrl + "/" + userId + "/execute-actions-email"
                    + "?client_id=sigba-frontend"
                    + "&redirect_uri=http://localhost:5173/reset-password";

            restClient.method(HttpMethod.PUT)
                    .uri(executeActionsUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(List.of("UPDATE_PASSWORD"))
                    .retrieve()
                    .toBodilessEntity();

            log.info("Email de réinitialisation envoyé à {}", email);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de réinitialisation à {}: {}", email, e.getMessage());
            throw new BusinessException("Erreur lors de l'envoi de l'email de réinitialisation : " + e.getMessage());
        }
    }

    public void reinitialiserMotDePasse(String email, String nouveauMotDePasse) {
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
                    .orElseThrow(() -> new BusinessException("Utilisateur non trouvé : " + email));

            Map<String, Object> passwordData = Map.of(
                    "type", "password",
                    "value", nouveauMotDePasse,
                    "temporary", false
            );

            restClient.put()
                    .uri(usersUrl + "/" + userId + "/reset-password")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(passwordData)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Mot de passe réinitialisé pour {}", email);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erreur lors de la réinitialisation du mot de passe pour {}: {}", email, e.getMessage());
            throw new BusinessException("Erreur lors de la réinitialisation du mot de passe : " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private String trouverUserIdParEmail(String adminToken, String email) {
        String usersUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm()
                + "/users";

        List<Map<String, Object>> users = restClient.get()
                .uri(usersUrl + "?email={email}", email)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .retrieve()
                .body(List.class);

        return users.stream()
                .findFirst()
                .map(obj -> (String) obj.get("id"))
                .orElseThrow(() -> new BusinessException("Utilisateur Keycloak non trouvé : " + email));
    }

    public Map<String, Object> getUtilisateurParId(String userId) {
        String adminToken = getAdminAccessToken();
        String userUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm()
                + "/users/" + userId;

        try {
            return restClient.get()
                    .uri(userUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'utilisateur Keycloak {}: {}", userId, e.getMessage());
            throw new BusinessException("Erreur lors de la récupération de l'utilisateur : " + e.getMessage());
        }
    }

    public void mettreAJourUtilisateur(String email, String nom, String prenom) {
        String adminToken = getAdminAccessToken();
        String userId = trouverUserIdParEmail(adminToken, email);
        String userUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm()
                + "/users/" + userId;

        try {
            Map<String, Object> userRepresentation = Map.of(
                    "firstName", prenom,
                    "lastName", nom
            );

            restClient.put()
                    .uri(userUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(userRepresentation)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Utilisateur Keycloak mis à jour : {}", email);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour de l'utilisateur Keycloak {}: {}", email, e.getMessage());
            throw new BusinessException("Erreur lors de la mise à jour de l'utilisateur : " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getRolesUtilisateur(String email) {
        String adminToken = getAdminAccessToken();
        String userId = trouverUserIdParEmail(adminToken, email);
        String rolesUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm()
                + "/users/" + userId + "/role-mappings/realm";

        try {
            return restClient.get()
                    .uri(rolesUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .retrieve()
                    .body(List.class);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des rôles pour {}: {}", email, e.getMessage());
            throw new BusinessException("Erreur lors de la récupération des rôles : " + e.getMessage());
        }
    }

    public void supprimerRoleUtilisateur(String email, String role) {
        String adminToken = getAdminAccessToken();
        String userId = trouverUserIdParEmail(adminToken, email);
        String realmUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm();

        try {
            List<Map<String, Object>> realmRoles = restClient.get()
                    .uri(realmUrl + "/roles")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .retrieve()
                    .body(List.class);

            Map<String, Object> roleObj = realmRoles.stream()
                    .filter(r -> role.equals(r.get("name")))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("Rôle Keycloak non trouvé : " + role));

            restClient.method(HttpMethod.DELETE)
                    .uri(realmUrl + "/users/" + userId + "/role-mappings/realm")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(List.of(roleObj))
                    .retrieve()
                    .toBodilessEntity();

            log.info("Rôle '{}' supprimé pour {} dans Keycloak", role, email);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erreur lors de la suppression du rôle '{}' pour {}: {}", role, email, e.getMessage());
            throw new BusinessException("Erreur lors de la suppression du rôle : " + e.getMessage());
        }
    }

    public void envoyerEmailVerification(String email) {
        String adminToken = getAdminAccessToken();
        String userId = trouverUserIdParEmail(adminToken, email);
        String verifyEmailUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm()
                + "/users/" + userId + "/send-verify-email"
                + "?client_id=sigba-frontend"
                + "&redirect_uri=http://localhost:5173";

        try {
            restClient.method(HttpMethod.PUT)
                    .uri(verifyEmailUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Email de vérification envoyé à {}", email);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de vérification à {}: {}", email, e.getMessage());
            throw new BusinessException("Erreur lors de l'envoi de l'email de vérification : " + e.getMessage());
        }
    }

    public void deconnecterUtilisateur(String email) {
        String adminToken = getAdminAccessToken();
        String userId = trouverUserIdParEmail(adminToken, email);
        String logoutUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm()
                + "/users/" + userId + "/logout";

        try {
            restClient.post()
                    .uri(logoutUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Utilisateur {} déconnecté de toutes les sessions Keycloak", email);
        } catch (Exception e) {
            log.error("Erreur lors de la déconnexion de {}: {}", email, e.getMessage());
            throw new BusinessException("Erreur lors de la déconnexion de l'utilisateur : " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getTousLesRoles() {
        String adminToken = getAdminAccessToken();
        String rolesUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm()
                + "/roles";

        try {
            return restClient.get()
                    .uri(rolesUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .retrieve()
                    .body(List.class);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des rôles Keycloak: {}", e.getMessage());
            throw new BusinessException("Erreur lors de la récupération des rôles : " + e.getMessage());
        }
    }

    public Map<String, Object> getRoleParNom(String roleName) {
        String adminToken = getAdminAccessToken();
        String roleUrl = keycloakConfig.getServerUrl()
                + "/admin/realms/" + keycloakConfig.getRealm()
                + "/roles/" + roleName;

        try {
            return restClient.get()
                    .uri(roleUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération du rôle Keycloak '{}': {}", roleName, e.getMessage());
            throw new BusinessException("Rôle non trouvé : " + roleName);
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
