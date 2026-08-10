package ma.ram.sigba.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PosteResponseDTO {

    private Long id;
    private String nom;
    private Long directionId;
    private String directionNom;
}
