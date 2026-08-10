package ma.ram.sigba.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Future;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValiderN1RequestDTO {

    @NotEmpty(message = "Au moins une zone doit être autorisée")
    private List<Long> zoneIds;

    @NotNull(message = "La date de fin de contrat est obligatoire")
    @Future(message = "La date de fin de contrat doit être dans le futur")
    private LocalDate dateFinContrat;
}
