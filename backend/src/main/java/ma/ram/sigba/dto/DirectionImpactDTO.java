package ma.ram.sigba.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectionImpactDTO {

    private long employesActifs;
    private long badgesActifs;
    private long demandesEnCours;
}
