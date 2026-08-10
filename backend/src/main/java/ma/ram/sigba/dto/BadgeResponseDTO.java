package ma.ram.sigba.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BadgeResponseDTO {

    private Long id;
    private String uidUnique;
    private Long employeId;
    private String employeNom;
    private String employePrenom;
    private String employeEmail;
    private String employeMatricule;
    private String directionNom;
    private Long demandeId;
    private String statut;
    private LocalDateTime dateEmission;
    private LocalDateTime dateExpiration;
    private LocalDateTime dateSuspension;
    private LocalDateTime dateRevocation;
    private List<HabilitationResponseDTO> habilitations;
    private LocalDateTime createdAt;
}
