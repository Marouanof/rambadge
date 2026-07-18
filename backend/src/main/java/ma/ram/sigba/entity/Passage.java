package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ram.sigba.entity.enums.ResultatPassage;

import java.time.LocalDateTime;

@Entity
@Table(name = "passage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Passage extends BaseEntity {

    @Column(name = "uid_badge", nullable = false)
    private String uidBadge;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    private Zone zone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    private User employe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "direction_id")
    private Direction direction;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime horodatage = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResultatPassage resultat;
}
