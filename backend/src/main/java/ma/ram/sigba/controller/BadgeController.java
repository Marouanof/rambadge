package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.dto.BadgeResponseDTO;
import ma.ram.sigba.service.BadgeService;
import ma.ram.sigba.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/badges")
@RequiredArgsConstructor
@Tag(name = "Gestion des Badges", description = "Listage, suspension, révocation, réactivation, expiration des badges")
public class BadgeController {

    private final BadgeService badgeService;
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'AGENT_SURETE')")
    @Operation(summary = "Lister les badges", description = "SUPER_ADMIN=tous, MANAGER/AGENT=su direction")
    public ResponseEntity<ApiResponse<Page<BadgeResponseDTO>>> listerBadges(
            @RequestParam(required = false) String statut,
            @PageableDefault(size = 20) Pageable pageable) {
        var user = userService.getCurrentUser();
        Page<BadgeResponseDTO> badges = (statut != null && !statut.isBlank())
                ? badgeService.listerBadgesParStatut(statut, pageable)
                : badgeService.listerBadges(user, pageable);
        return ResponseEntity.ok(ApiResponse.ok(badges));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'AGENT_SURETE', 'EMPLOYE')")
    @Operation(summary = "Détail d'un badge")
    public ResponseEntity<ApiResponse<BadgeResponseDTO>> getBadge(@PathVariable Long id) {
        BadgeResponseDTO badge = badgeService.getBadgeById(id);
        return ResponseEntity.ok(ApiResponse.ok(badge));
    }

    @GetMapping("/uid/{uid}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENT_SURETE')")
    @Operation(summary = "Rechercher un badge par UID")
    public ResponseEntity<ApiResponse<BadgeResponseDTO>> getBadgeByUid(@PathVariable String uid) {
        BadgeResponseDTO badge = badgeService.getBadgeByUid(uid);
        return ResponseEntity.ok(ApiResponse.ok(badge));
    }

    @GetMapping("/employe/{employeId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'AGENT_SURETE', 'EMPLOYE')")
    @Operation(summary = "Badge d'un employé")
    public ResponseEntity<ApiResponse<BadgeResponseDTO>> getBadgeByEmploye(@PathVariable Long employeId) {
        BadgeResponseDTO badge = badgeService.getBadgeByEmployeId(employeId);
        return ResponseEntity.ok(ApiResponse.ok(badge));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('EMPLOYE')")
    @Operation(summary = "Mon badge", description = "Retourne le badge de l'employé connecté, ou null s'il n'en a pas.")
    public ResponseEntity<ApiResponse<BadgeResponseDTO>> monBadge() {
        var employe = userService.getCurrentUser();
        BadgeResponseDTO badge = badgeService.getBadgeByEmployeIdOptional(employe.getId());
        return ResponseEntity.ok(ApiResponse.ok(badge));
    }

    @PatchMapping("/{id}/suspend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENT_SURETE')")
    @Operation(summary = "Suspendre un badge", description = "En cas d'incident (perte, vol)")
    public ResponseEntity<ApiResponse<BadgeResponseDTO>> suspendreBadge(@PathVariable Long id) {
        BadgeResponseDTO badge = badgeService.suspendreBadge(id);
        return ResponseEntity.ok(ApiResponse.ok("Badge suspendu", badge));
    }

    @PatchMapping("/{id}/reactivate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENT_SURETE')")
    @Operation(summary = "Réactiver un badge suspendu", description = "Lever la suspension après enquête")
    public ResponseEntity<ApiResponse<BadgeResponseDTO>> reactiverBadge(@PathVariable Long id) {
        BadgeResponseDTO badge = badgeService.reactiverBadge(id);
        return ResponseEntity.ok(ApiResponse.ok("Badge réactivé", badge));
    }

    @PatchMapping("/{id}/revoke")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENT_SURETE')")
    @Operation(summary = "Révoquer définitivement un badge", description = "Annule le badge et toutes ses habilitations")
    public ResponseEntity<ApiResponse<BadgeResponseDTO>> revoquerBadge(@PathVariable Long id) {
        BadgeResponseDTO badge = badgeService.revoquerBadge(id);
        return ResponseEntity.ok(ApiResponse.ok("Badge révoqué définitivement", badge));
    }
}
