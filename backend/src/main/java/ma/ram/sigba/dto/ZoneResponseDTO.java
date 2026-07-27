package ma.ram.sigba.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ZoneResponseDTO {

    private Long id;
    private String nom;
    private String code;
    private String description;
}
