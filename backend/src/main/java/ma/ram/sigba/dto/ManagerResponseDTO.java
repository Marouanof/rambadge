package ma.ram.sigba.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManagerResponseDTO {

    private Long id;
    private String nom;
    private String prenom;
    private String matricule;
    private String poste;
    private String email;
    private String role;
    private String statut;
    private Long directionId;
    private String directionNom;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
