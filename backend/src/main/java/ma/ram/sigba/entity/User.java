package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.entity.enums.UserStatut;
import ma.ram.sigba.validation.RamEmail;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @RamEmail
    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(unique = true, nullable = false)
    private String matricule;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserStatut statut = UserStatut.ACTIF;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "direction_id")
    private Direction direction;
}
