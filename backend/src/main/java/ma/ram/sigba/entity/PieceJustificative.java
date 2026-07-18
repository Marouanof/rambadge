package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ram.sigba.entity.enums.TypePiece;

@Entity
@Table(name = "piece_justificative")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PieceJustificative extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    private Demande demande;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_piece", nullable = false)
    private TypePiece typePiece;

    @Column(name = "fichier_url", nullable = false)
    private String fichierUrl;
}
