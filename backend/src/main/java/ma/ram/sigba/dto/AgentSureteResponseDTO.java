package ma.ram.sigba.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentSureteResponseDTO {

    private Long id;
    private String nom;
    private String prenom;
    private String matricule;
    private String email;
    private String role;
    private String statut;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
