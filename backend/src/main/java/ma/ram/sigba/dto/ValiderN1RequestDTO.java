package ma.ram.sigba.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValiderN1RequestDTO {

    private String justifications;

    @NotEmpty(message = "Au moins une zone doit être sélectionnée")
    private List<ZoneSelectionDTO> zones;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ZoneSelectionDTO {
        private Long zoneId;
        private String justification;
    }
}
