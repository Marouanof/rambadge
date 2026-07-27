package ma.ram.sigba.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabilitationResponseDTO {

    private Long id;
    private Long badgeId;
    private Long zoneId;
    private String zoneNom;
    private String zoneCode;
    private String statut;
    private LocalDateTime dateAttribution;
    private LocalDateTime dateRevocation;
}
