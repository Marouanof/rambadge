package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ram.sigba.entity.enums.InvitationStatut;
import ma.ram.sigba.validation.RamEmail;

import java.time.LocalDateTime;

@Entity
@Table(name = "invitation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invitation extends BaseEntity {

    @Column(name = "code_unique", unique = true, nullable = false)
    private String codeUnique;

    @RamEmail
    @Column(name = "email_destinataire", nullable = false)
    private String emailDestinataire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "direction_id", nullable = false)
    private Direction direction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emetteur_id", nullable = false)
    private User emetteur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private InvitationStatut statut = InvitationStatut.EN_ATTENTE;

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;
}
