package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "zone")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Zone extends BaseEntity {

    @Column(nullable = false)
    private String nom;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;
}
