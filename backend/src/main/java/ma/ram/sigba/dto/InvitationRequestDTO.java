package ma.ram.sigba.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvitationRequestDTO {

    @NotBlank(message = "L'email du destinataire est obligatoire")
    @Email(message = "L'email doit être valide")
    private String emailDestinataire;
}
