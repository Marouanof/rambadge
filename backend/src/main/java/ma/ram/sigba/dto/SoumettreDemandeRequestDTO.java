package ma.ram.sigba.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SoumettreDemandeRequestDTO {

    @NotEmpty(message = "Au moins une pièce justificative est requise")
    private List<PieceJustificativeDTO> pieces;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PieceJustificativeDTO {
        @NotBlank(message = "Le type de pièce est requis")
        private String typePiece;
        @NotBlank(message = "L'URL du fichier est requise")
        private String fichierUrl;
    }
}
