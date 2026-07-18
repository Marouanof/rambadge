package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ram.sigba.entity.enums.Decision;

import java.time.LocalDateTime;

@Entity
@Table(name = "validation_n1")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationN1 extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    private Demande demande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Decision decision;

    @Column(columnDefinition = "TEXT")
    private String justifications;

    @Column(name = "date_validation")
    private LocalDateTime dateValidation;

    @Column(name = "motif_refus", columnDefinition = "TEXT")
    private String motifRefus;
}
