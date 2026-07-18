package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ram.sigba.entity.enums.HabilitationStatut;

import java.time.LocalDateTime;

@Entity
@Table(name = "habilitation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Habilitation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "badge_id", nullable = false)
    private Badge badge;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    private Zone zone;

    @Column(name = "date_attribution", nullable = false)
    private LocalDateTime dateAttribution;

    @Column(name = "date_revocation")
    private LocalDateTime dateRevocation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private HabilitationStatut statut = HabilitationStatut.ACTIVE;
}
