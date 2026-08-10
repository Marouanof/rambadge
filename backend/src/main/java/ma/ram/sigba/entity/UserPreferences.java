package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ram.sigba.entity.enums.ThemePreference;

@Entity
@Table(name = "user_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreferences extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private String langue = "fr";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ThemePreference theme = ThemePreference.LIGHT;

    @Column(nullable = false)
    @Builder.Default
    private Boolean notifEmail = true;
}
