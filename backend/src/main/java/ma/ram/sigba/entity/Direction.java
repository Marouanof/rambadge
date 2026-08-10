package ma.ram.sigba.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "direction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Direction extends BaseEntity {

    @Column(nullable = false)
    private String nom;

    @Column(name = "code_direction", unique = true, nullable = false)
    private String codeDirection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", unique = true)
    @JsonIgnore
    private User manager;

    @Column(nullable = false)
    private String statut;
}
