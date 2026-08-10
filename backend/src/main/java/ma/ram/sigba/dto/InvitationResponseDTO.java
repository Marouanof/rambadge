package ma.ram.sigba.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvitationResponseDTO {

    private Long id;
    private String codeUnique;
    private String emailDestinataire;
    private Long directionId;
    private String directionNom;
    private List<String> postes;
    private String emetteurNom;
    private String emetteurEmail;
    private String statut;
    private LocalDateTime dateExpiration;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
