package ma.ram.sigba;

import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.repository.UserRepository;
import ma.ram.sigba.service.KeycloakService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    CommandLineRunner initSuperAdmin(UserRepository userRepository, KeycloakService keycloakService) {
        return args -> {
            String email = "admin@ram.ma";

            boolean existsInKeycloak = keycloakService.utilisateurExiste(email);
            if (!existsInKeycloak) {
                keycloakService.creerUtilisateur(email, "Admin", "RAM", "A001", "SUPER_ADMIN");
                keycloakService.reinitialiserMotDePasse(email, "password");
                try {
                    keycloakService.envoyerEmailActivation(email);
                } catch (Exception e) {
                    System.err.println("Email d'activation non envoye (SMTP non configure) : " + e.getMessage());
                }
                System.out.println("Super-Admin cree dans Keycloak : " + email);
            }

            if (userRepository.findByEmail(email).isEmpty()) {
                User admin = User.builder()
                        .email(email)
                        .nom("Admin")
                        .prenom("RAM")
                        .matricule("SA001")
                        .poste("Super Administrateur")
                        .role(UserRole.SUPER_ADMIN)
                        .build();
                userRepository.save(admin);
                System.out.println("Super-Admin cree en BDD : " + email);
            }
        };
    }
}
