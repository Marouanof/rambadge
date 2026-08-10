package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "poste")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Poste extends BaseEntity {

    @Column(nullable = false)
    private String nom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "direction_id", nullable = false)
    private Direction direction;
}
