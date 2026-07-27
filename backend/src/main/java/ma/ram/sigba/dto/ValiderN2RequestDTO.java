package ma.ram.sigba.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValiderN2RequestDTO {

    @NotNull(message = "La checklist de conformité est requise")
    private ChecklistConformiteDTO checklistConformite;

    @NotEmpty(message = "Au moins une décision de zone est requise")
    private List<ZoneDecisionDTO> zones;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ZoneDecisionDTO {
        private Long zoneDemandeeId;
        private boolean validee;
    }
}
