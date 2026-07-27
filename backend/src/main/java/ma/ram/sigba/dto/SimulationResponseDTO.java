package ma.ram.sigba.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulationResponseDTO {

    private String uidBadge;
    private Long zoneId;
    private String zoneNom;
    private boolean autorise;
    private String motif;
}
