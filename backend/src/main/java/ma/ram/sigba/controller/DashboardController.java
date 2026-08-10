package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.entity.Badge;
import ma.ram.sigba.entity.Demande;
import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.enums.BadgeStatut;
import ma.ram.sigba.entity.enums.DemandeStatut;
import ma.ram.sigba.entity.enums.IncidentStatut;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.repository.*;
import ma.ram.sigba.service.UserService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Tableau de bord", description = "Statistiques et indicateurs selon le rôle")
public class DashboardController {

    private static final DateTimeFormatter JOUR_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final BadgeRepository badgeRepository;
    private final DemandeRepository demandeRepository;
    private final IncidentRepository incidentRepository;
    private final PassageRepository passageRepository;
    private final HabilitationRepository habilitationRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    @GetMapping("/super-admin")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Stats globales (Super Admin)", description = "Badges par statut, demandes, alertes, évolution")
    public ResponseEntity<ApiResponse<Map<String, Object>>> statsSuperAdmin() {
        Map<String, Object> stats = new HashMap<>();

        Map<String, Long> badgesParStatut = new HashMap<>();
        for (BadgeStatut s : BadgeStatut.values()) {
            long count = badgeRepository.findByStatut(s, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
            badgesParStatut.put(s.name(), count);
        }

        stats.put("totalBadges", badgeRepository.count());
        stats.put("badgesParStatut", badgesParStatut);
        stats.put("totalEmployes", userRepository.countByRole(UserRole.EMPLOYE));
        stats.put("incidentsEnCours", incidentRepository.countByStatut(IncidentStatut.SUSPENDU));
        stats.put("totalPassages", passageRepository.count());

        Map<String, Long> demandesParStatut = new HashMap<>();
        for (DemandeStatut ds : DemandeStatut.values()) {
            long count = demandeRepository.findByStatutOrderByCreatedAtDesc(ds, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
            demandesParStatut.put(ds.name(), count);
        }
        stats.put("demandesParStatut", demandesParStatut);

        stats.put("passagesParJour", evolutionsParJour(passageRepository.countParJourDepuis(LocalDateTime.now().minusDays(29))));
        stats.put("demandesParJour", evolutionsParJour(demandeRepository.countParJourDepuis(LocalDateTime.now().minusDays(29))));
        stats.put("badgesParDirection", pairsSimples(badgeRepository.countParDirection()));
        stats.put("passagesParZone", pairsSimples(passageRepository.countParZone()));
        stats.put("derniersPassages", derniersPassages());
        stats.put("badgesExpirantSous30J", badgesExpirantSous30J());
        stats.put("demandesPlusAnciennes", demandesPlusAnciennes());

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    private List<Map<String, Object>> evolutionsParJour(List<Object[]> rows) {
        Map<LocalDate, Long> parJour = new HashMap<>();
        for (Object[] row : rows) {
            LocalDate jour = toLocalDate(row[0]);
            parJour.put(jour, (Long) row[1]);
        }
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDate debut = LocalDate.now().minusDays(29);
        for (int i = 0; i < 30; i++) {
            LocalDate jour = debut.plusDays(i);
            Map<String, Object> item = new HashMap<>();
            item.put("jour", jour.format(JOUR_FORMAT));
            item.put("valeur", parJour.getOrDefault(jour, 0L));
            result.add(item);
        }
        return result;
    }

    private LocalDate toLocalDate(Object value) {
        if (value instanceof java.sql.Timestamp ts) {
            return ts.toLocalDateTime().toLocalDate();
        }
        if (value instanceof LocalDateTime ldt) {
            return ldt.toLocalDate();
        }
        if (value instanceof LocalDate ld) {
            return ld;
        }
        return LocalDate.now();
    }

    private List<Map<String, Object>> pairsSimples(List<Object[]> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("nom", row[0]);
            item.put("valeur", row[1]);
            result.add(item);
        }
        return result;
    }

    private List<Map<String, Object>> derniersPassages() {
        LocalDateTime depuis = LocalDateTime.now().minusDays(7);
        return passageRepository.findByHorodatageBetweenOrderByHorodatageDesc(depuis, LocalDateTime.now(), PageRequest.of(0, 5))
                .getContent().stream().map(p -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("uidBadge", p.getUidBadge());
                    item.put("employeNom", (p.getEmploye() != null ? p.getEmploye().getNom() : "") + " " + (p.getEmploye() != null ? p.getEmploye().getPrenom() : ""));
                    item.put("directionNom", p.getDirection() != null ? p.getDirection().getNom() : "-");
                    item.put("zoneNom", p.getZone() != null ? p.getZone().getNom() : "-");
                    item.put("resultat", p.getResultat() != null ? p.getResultat().name() : "-");
                    item.put("horodatage", p.getHorodatage() != null ? p.getHorodatage().toString() : null);
                    return item;
                }).toList();
    }

    private List<Map<String, Object>> badgesExpirantSous30J() {
        LocalDateTime now = LocalDateTime.now();
        return badgeRepository.findByStatutAndDateExpirationBetweenOrderByDateExpirationAsc(
                        BadgeStatut.ACTIF, now, now.plusDays(30), PageRequest.of(0, 10))
                .getContent().stream().map(b -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("uidUnique", b.getUidUnique());
                    item.put("employeNom", b.getEmploye() != null ? b.getEmploye().getNom() + " " + b.getEmploye().getPrenom() : "-");
                    item.put("dateExpiration", b.getDateExpiration() != null ? b.getDateExpiration().toLocalDate().format(JOUR_FORMAT) : null);
                    return item;
                }).toList();
    }

    private List<Map<String, Object>> demandesPlusAnciennes() {
        return demandeRepository.findPlusAnciennesParStatuts(
                        List.of(DemandeStatut.EN_ATTENTE_N1, DemandeStatut.EN_ATTENTE_N2), PageRequest.of(0, 5))
                .stream().map(d -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", d.getId());
                    item.put("employeNom", d.getEmploye() != null ? d.getEmploye().getNom() + " " + d.getEmploye().getPrenom() : "-");
                    item.put("directionNom", d.getEmploye() != null && d.getEmploye().getDirection() != null ? d.getEmploye().getDirection().getNom() : "-");
                    item.put("statut", d.getStatut() != null ? d.getStatut().name() : "-");
                    item.put("ageJours", d.getCreatedAt() != null ? Duration.between(d.getCreatedAt(), LocalDateTime.now()).toDays() : 0);
                    return item;
                }).toList();
    }

    @GetMapping("/manager")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Stats de la direction (Manager)", description = "Demandes en attente, employés, expirations")
    public ResponseEntity<ApiResponse<Map<String, Object>>> statsManager() {
        var manager = userService.getCurrentUser();
        Map<String, Object> stats = new HashMap<>();

        Long directionId = manager.getDirection() != null ? manager.getDirection().getId() : null;
        if (directionId != null) {
            stats.put("badgesDirection", badgeRepository.findByEmployeDirectionId(directionId,
                    org.springframework.data.domain.Pageable.unpaged()).getTotalElements());
            stats.put("demandesN1EnAttente", demandeRepository.countByEmployeDirectionIdAndStatut(directionId,
                    DemandeStatut.EN_ATTENTE_N1));
            stats.put("demandesN2EnAttente", demandeRepository.countByEmployeDirectionIdAndStatut(directionId,
                    DemandeStatut.EN_ATTENTE_N2));
            long employesDirection = userRepository.countByDirectionIdAndRole(directionId, UserRole.EMPLOYE);
            stats.put("employesDirection", employesDirection);
            stats.put("employesSansBadge", employesDirection
                    - badgeRepository.countByEmployeDirectionId(directionId));
            stats.put("employesSuspendus", userRepository.countByDirectionIdAndRoleAndStatut(
                    directionId, UserRole.EMPLOYE, ma.ram.sigba.entity.enums.UserStatut.SUSPENDU));
            LocalDateTime maintenant = LocalDateTime.now();
            stats.put("badgesExpirant30J", badgeRepository.countByEmployeDirectionIdAndStatutAndDateExpirationBetween(
                    directionId, BadgeStatut.ACTIF, maintenant, maintenant.plusDays(30)));
            stats.put("incidentsDirection", incidentRepository.findByBadgeEmployeDirectionIdOrderByDateIncidentDesc(directionId,
                    org.springframework.data.domain.Pageable.unpaged()).getTotalElements());
            stats.put("incidentsParType", incidentsParType(directionId));
            stats.put("passagesDirection", passageRepository.findByEmployeDirectionIdOrderByHorodatageDesc(directionId,
                    org.springframework.data.domain.Pageable.unpaged()).getTotalElements());
        }

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    private Map<String, Long> incidentsParType(Long directionId) {
        Map<String, Long> result = new HashMap<>();
        for (ma.ram.sigba.entity.enums.TypeIncident type : ma.ram.sigba.entity.enums.TypeIncident.values()) {
            result.put(type.name(), incidentRepository.countByBadgeEmployeDirectionIdAndTypeIncident(directionId, type));
        }
        return result;
    }

    @GetMapping("/surete")
    @PreAuthorize("hasRole('AGENT_SURETE')")
    @Operation(summary = "Stats sûreté (Agent)", description = "Dossiers à instruire, alertes, badges par zone")
    public ResponseEntity<ApiResponse<Map<String, Object>>> statsSurete() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("demandesN2EnAttente", demandeRepository.findByStatutOrderByCreatedAtDesc(DemandeStatut.EN_ATTENTE_N2,
                org.springframework.data.domain.Pageable.unpaged()).getTotalElements());
        stats.put("incidentsEnCours", incidentRepository.countByStatut(IncidentStatut.SUSPENDU));
        stats.put("badgesActifs", badgeRepository.findByStatut(BadgeStatut.ACTIF,
                org.springframework.data.domain.Pageable.unpaged()).getTotalElements());
        stats.put("totalPassages", passageRepository.count());
        Map<String, Long> badgesParZone = habilitationRepository.countBadgesActifsParZone().stream()
                .collect(java.util.stream.Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]));
        stats.put("badgesParZone", badgesParZone);
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/employe")
    @PreAuthorize("hasRole('EMPLOYE')")
    @Operation(summary = "Stats personnelles (Employé)", description = "Statut badge, historique, demandes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> statsEmploye() {
        var user = userService.getCurrentUser();
        Map<String, Object> stats = new HashMap<>();

        stats.put("compteStatut", user.getStatut().name());

        badgeRepository.findByEmployeId(user.getId()).ifPresent(b -> {
            Map<String, Object> badgeInfo = new HashMap<>();
            badgeInfo.put("uidUnique", b.getUidUnique());
            badgeInfo.put("statut", b.getStatut().name());
            badgeInfo.put("dateEmission", b.getDateEmission() != null ? b.getDateEmission().toString() : null);
            badgeInfo.put("dateExpiration", b.getDateExpiration() != null ? b.getDateExpiration().toString() : null);
            badgeInfo.put("dateSuspension", b.getDateSuspension() != null ? b.getDateSuspension().toString() : null);
            badgeInfo.put("dateRevocation", b.getDateRevocation() != null ? b.getDateRevocation().toString() : null);
            stats.put("badge", badgeInfo);
        });

        boolean hasActiveBadge = badgeRepository.existsByEmployeIdAndStatutIn(user.getId(),
                java.util.List.of(BadgeStatut.ACTIF, BadgeStatut.SUSPENDU));
        stats.put("aBadgeActif", hasActiveBadge);
        stats.put("passages", passageRepository.countByEmployeIdAndResultat(user.getId(),
                ma.ram.sigba.entity.enums.ResultatPassage.AUTORISE));

        stats.put("derniersPassages", passageRepository
                .findByEmployeIdOrderByHorodatageDesc(user.getId(), PageRequest.of(0, 5))
                .getContent().stream().map(p -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", p.getId());
                    item.put("zoneNom", p.getZone() != null ? p.getZone().getNom() : "-");
                    item.put("resultat", p.getResultat() != null ? p.getResultat().name() : "-");
                    item.put("horodatage", p.getHorodatage() != null ? p.getHorodatage().toString() : null);
                    return item;
                }).toList());

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
