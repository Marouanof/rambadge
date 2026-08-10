package ma.ram.sigba.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalerIncidentRequestDTO {

    @NotNull(message = "L'ID du badge est obligatoire")
    private Long badgeId;

    @NotBlank(message = "Le type d'incident est obligatoire")
    private String typeIncident;

    private String commentaire;

    private LocalDate dateFinContrat;
}
