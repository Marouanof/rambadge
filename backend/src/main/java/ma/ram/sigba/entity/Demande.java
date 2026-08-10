package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ram.sigba.entity.enums.DemandeStatut;

import java.time.LocalDate;

@Entity
@Table(name = "demande")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Demande extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    private User employe;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DemandeStatut statut = DemandeStatut.EN_ATTENTE_N1;

    @Column(name = "motif_refus", columnDefinition = "TEXT")
    private String motifRefus;

    @Column(name = "date_fin_contrat")
    private LocalDate dateFinContrat;
}
