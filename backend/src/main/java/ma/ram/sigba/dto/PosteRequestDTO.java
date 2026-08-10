package ma.ram.sigba.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PosteRequestDTO {

    @NotBlank(message = "Le nom du poste est obligatoire")
    private String nom;
}
