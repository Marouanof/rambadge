package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.enums.BadgeStatut;
import ma.ram.sigba.entity.enums.DemandeStatut;
import ma.ram.sigba.entity.enums.IncidentStatut;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.repository.*;
import ma.ram.sigba.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Tableau de bord", description = "Statistiques et indicateurs selon le rôle")
public class DashboardController {

    private final BadgeRepository badgeRepository;
    private final DemandeRepository demandeRepository;
    private final IncidentRepository incidentRepository;
    private final PassageRepository passageRepository;
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

        return ResponseEntity.ok(ApiResponse.ok(stats));
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
            stats.put("incidentsDirection", incidentRepository.findByBadgeEmployeDirectionId(directionId,
                    org.springframework.data.domain.Pageable.unpaged()).getTotalElements());
            stats.put("passagesDirection", passageRepository.findByEmployeDirectionIdOrderByHorodatageDesc(directionId,
                    org.springframework.data.domain.Pageable.unpaged()).getTotalElements());
        }

        return ResponseEntity.ok(ApiResponse.ok(stats));
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
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/employe")
    @PreAuthorize("hasRole('EMPLOYE')")
    @Operation(summary = "Stats personnelles (Employé)", description = "Statut badge, historique, demandes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> statsEmploye() {
        var user = userService.getCurrentUser();
        Map<String, Object> stats = new HashMap<>();

        boolean hasActiveBadge = badgeRepository.existsByEmployeIdAndStatutIn(user.getId(),
                java.util.List.of(BadgeStatut.ACTIF, BadgeStatut.SUSPENDU));
        stats.put("aBadgeActif", hasActiveBadge);
        stats.put("passages", passageRepository.countByEmployeIdAndResultat(user.getId(),
                ma.ram.sigba.entity.enums.ResultatPassage.AUTORISE));

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
