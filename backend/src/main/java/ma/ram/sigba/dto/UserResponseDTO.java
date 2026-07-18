package ma.ram.sigba.dto;

import lombok.*;

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
}
