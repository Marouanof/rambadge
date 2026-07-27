package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ram.sigba.entity.enums.Decision;

import java.time.LocalDateTime;

@Entity
@Table(name = "validation_n2")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationN2 extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    private Demande demande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private User agent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Decision decision;

    @Column(nullable = false)
    private boolean casierJudiciaire;

    @Column(nullable = false)
    private boolean attestationFormation;

    @Column(nullable = false)
    private boolean justificationPoste;

    @Column(nullable = false)
    private boolean pieceIdentite;

    @Column(name = "date_validation")
    private LocalDateTime dateValidation;

    @Column(name = "motif_refus", columnDefinition = "TEXT")
    private String motifRefus;
}
