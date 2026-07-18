package ma.ram.sigba.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectionResponseDTO {

    private Long id;
    private String nom;
    private String codeDirection;
    private String managerNom;
    private String managerEmail;
    private int nombreEmployes;
    private String statut;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
