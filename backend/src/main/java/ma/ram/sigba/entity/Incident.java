package ma.ram.sigba.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ram.sigba.entity.enums.IncidentStatut;
import ma.ram.sigba.entity.enums.TypeIncident;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "incident")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "badge_id", nullable = false)
    private Badge badge;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signalant_id", nullable = false)
    private User signalant;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_incident", nullable = false)
    private TypeIncident typeIncident;

    @Column(name = "date_incident", nullable = false)
    private LocalDateTime dateIncident;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Column(name = "date_fin_contrat")
    private LocalDate dateFinContrat;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private IncidentStatut statut = IncidentStatut.SUSPENDU;

    @Column(name = "date_traitement")
    private LocalDateTime dateTraitement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private User agent;
}
