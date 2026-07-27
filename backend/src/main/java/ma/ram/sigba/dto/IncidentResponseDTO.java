package ma.ram.sigba.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentResponseDTO {

    private Long id;
    private Long badgeId;
    private String badgeUid;
    private Long signalantId;
    private String signalantNom;
    private String typeIncident;
    private LocalDateTime dateIncident;
    private String commentaire;
    private String statut;
    private LocalDateTime dateTraitement;
    private Long agentId;
    private String agentNom;
    private String directionNom;
    private LocalDateTime createdAt;
}
