package ma.ram.sigba.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistConformiteDTO {
    private boolean casierJudiciaire;
    private boolean attestationFormation;
    private boolean justificationPoste;
    private boolean pieceIdentite;
}
