package ma.ram.sigba.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulatePassageRequestDTO {

    @NotBlank(message = "L'UID du badge est obligatoire")
    private String uidBadge;

    @NotNull(message = "L'ID de la zone est obligatoire")
    private Long zoneId;
}
