package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ram.sigba.entity.enums.ZoneDemandeeStatut;

@Entity
@Table(name = "zone_demandee")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ZoneDemandee extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    private Demande demande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    private Zone zone;

    @Column(columnDefinition = "TEXT")
    private String justification;

    @Column(name = "motif_refus", columnDefinition = "TEXT")
    private String motifRefus;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_n1", nullable = false)
    @Builder.Default
    private ZoneDemandeeStatut statutN1 = ZoneDemandeeStatut.EN_ATTENTE;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_n2", nullable = false)
    @Builder.Default
    private ZoneDemandeeStatut statutN2 = ZoneDemandeeStatut.EN_ATTENTE;
}
