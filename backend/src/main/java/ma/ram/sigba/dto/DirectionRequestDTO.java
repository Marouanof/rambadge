package ma.ram.sigba.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectionRequestDTO {

    @NotBlank(message = "Le nom de la direction est obligatoire")
    private String nom;

    @NotBlank(message = "Le code direction est obligatoire")
    private String codeDirection;
}
