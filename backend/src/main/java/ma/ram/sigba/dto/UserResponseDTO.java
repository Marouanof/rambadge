package ma.ram.sigba.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponseDTO {

    private Long id;
    private String email;
    private String nom;
    private String prenom;
    private String matricule;
    private String role;
    private String statut;
    private String directionNom;
    private Long badgeId;
    private LocalDateTime dateExpirationBadge;
    private List<String> zonesHabilitees;
}
