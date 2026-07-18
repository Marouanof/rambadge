package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ram.sigba.entity.enums.BadgeStatut;

import java.time.LocalDateTime;

@Entity
@Table(name = "badge")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Badge extends BaseEntity {

    @Column(name = "uid_unique", unique = true, nullable = false)
    private String uidUnique;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    private User employe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    private Demande demande;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BadgeStatut statut = BadgeStatut.EN_ATTENTE;

    @Column(name = "date_emission")
    private LocalDateTime dateEmission;

    @Column(name = "date_expiration")
    private LocalDateTime dateExpiration;

    @Column(name = "date_suspension")
    private LocalDateTime dateSuspension;

    @Column(name = "date_revocation")
    private LocalDateTime dateRevocation;
}
