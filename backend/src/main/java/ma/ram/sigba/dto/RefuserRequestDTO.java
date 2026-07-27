package ma.ram.sigba.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefuserRequestDTO {

    @NotBlank(message = "Le motif de refus est obligatoire")
    private String motifRefus;
}
