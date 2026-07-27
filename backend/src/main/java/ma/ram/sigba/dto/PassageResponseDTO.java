package ma.ram.sigba.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PassageResponseDTO {

    private Long id;
    private String uidBadge;
    private Long zoneId;
    private String zoneNom;
    private Long employeId;
    private String employeNom;
    private String directionNom;
    private LocalDateTime horodatage;
    private String resultat;
    private LocalDateTime createdAt;
}
