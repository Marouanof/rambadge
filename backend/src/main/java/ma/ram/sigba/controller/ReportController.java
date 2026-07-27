package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.enums.ResultatPassage;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.repository.BadgeRepository;
import ma.ram.sigba.repository.IncidentRepository;
import ma.ram.sigba.repository.PassageRepository;
import ma.ram.sigba.service.UserService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Rapports & Audit", description = "Génération de rapports et historique d'audit")
public class ReportController {

    private final BadgeRepository badgeRepository;
    private final IncidentRepository incidentRepository;
    private final PassageRepository passageRepository;
    private final UserService userService;

    @GetMapping("/audit")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'AGENT_SURETE')")
    @Operation(summary = "Rapport d'audit", description = "Résumé global : badges, incidents, passages sur une période")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rapportAudit(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {

        var user = userService.getCurrentUser();
        Map<String, Object> rapport = new HashMap<>();

        long totalBadges = badgeRepository.count();
        long badgesActifs = badgeRepository.findByStatut(ma.ram.sigba.entity.enums.BadgeStatut.ACTIF,
                org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        long badgesSuspendus = badgeRepository.findByStatut(ma.ram.sigba.entity.enums.BadgeStatut.SUSPENDU,
                org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        long badgesRevokes = badgeRepository.findByStatut(ma.ram.sigba.entity.enums.BadgeStatut.REVOQUE,
                org.springframework.data.domain.Pageable.unpaged()).getTotalElements();

        rapport.put("periode", Map.of("debut", debut, "fin", fin));
        rapport.put("badges", Map.of(
                "total", totalBadges,
                "actifs", badgesActifs,
                "suspendus", badgesSuspendus,
                "revoques", badgesRevokes));
        rapport.put("incidentsEnCours", incidentRepository.countByStatut(
                ma.ram.sigba.entity.enums.IncidentStatut.SUSPENDU));

        if (debut != null && fin != null) {
            rapport.put("passagesPeriode", passageRepository.findByHorodatageBetweenOrderByHorodatageDesc(
                    debut, fin, org.springframework.data.domain.Pageable.unpaged()).getTotalElements());
        }

        rapport.put("totalPassages", passageRepository.count());
        rapport.put("auteur", user.getEmail());
        rapport.put("dateGeneration", LocalDateTime.now());

        return ResponseEntity.ok(ApiResponse.ok(rapport));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'AGENT_SURETE')")
    @Operation(summary = "Exporter un rapport (PDF/CSV)", description = "Endpoint à implémenter avec bibliothèque d'export")
    public ResponseEntity<ApiResponse<String>> exporterRapport(
            @RequestParam(defaultValue = "csv") String format) {
        return ResponseEntity.ok(ApiResponse.ok("Export " + format.toUpperCase() + " en cours de développement"));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER')")
    @Operation(summary = "Historique des exports précédents", description = "À implémenter avec une table d'exports")
    public ResponseEntity<ApiResponse<String>> historiqueExports() {
        return ResponseEntity.ok(ApiResponse.ok("Historique des exports en cours de développement"));
    }
}
