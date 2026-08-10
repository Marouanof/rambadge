package ma.ram.sigba.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreferencesDTO {

    @NotNull(message = "Le thème est obligatoire")
    private String theme;
}
