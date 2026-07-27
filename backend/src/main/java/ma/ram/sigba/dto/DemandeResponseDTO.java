package ma.ram.sigba.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeResponseDTO {

    private Long id;
    private String employeNom;
    private String employePrenom;
    private String employeEmail;
    private String directionNom;
    private String statut;
    private String motifRefus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PieceJustificativeResponseDTO> pieces;
    private List<ZoneDemandeeResponseDTO> zonesDemandees;
    private ValidationN1ResponseDTO validationN1;
    private ValidationN2ResponseDTO validationN2;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PieceJustificativeResponseDTO {
        private Long id;
        private String typePiece;
        private String fichierUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ZoneDemandeeResponseDTO {
        private Long id;
        private Long zoneId;
        private String zoneNom;
        private String justification;
        private String statutN1;
        private String statutN2;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ValidationN1ResponseDTO {
        private Long id;
        private String managerNom;
        private String decision;
        private String justifications;
        private String motifRefus;
        private LocalDateTime dateValidation;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ValidationN2ResponseDTO {
        private Long id;
        private String agentNom;
        private String decision;
        private ChecklistConformiteDTO checklistConformite;
        private String motifRefus;
        private LocalDateTime dateValidation;
    }
}
