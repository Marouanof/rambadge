package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.dto.HabilitationResponseDTO;
import ma.ram.sigba.entity.Habilitation;
import ma.ram.sigba.entity.enums.HabilitationStatut;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.HabilitationRepository;
import ma.ram.sigba.service.BadgeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/habilitations")
@RequiredArgsConstructor
@Tag(name = "Gestion des Habilitations", description = "Habilitations zone d'un badge — révocation individuelle")
public class HabilitationController {

    private final HabilitationRepository habilitationRepository;
    private final BadgeService badgeService;

    @GetMapping("/badge/{badgeId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'AGENT_SURETE', 'EMPLOYE')")
    @Operation(summary = "Lister les habilitations d'un badge")
    public ResponseEntity<ApiResponse<List<HabilitationResponseDTO>>> listerHabilitations(@PathVariable Long badgeId) {
        List<HabilitationResponseDTO> habilitations = habilitationRepository.findByBadgeId(badgeId).stream()
                .map(badgeService::toHabilitationResponseDTO)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(habilitations));
    }

    @PatchMapping("/{id}/revoke")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENT_SURETE')")
    @Operation(summary = "Révoquer une habilitation", description = "Retire l'accès à une zone spécifique sans toucher au badge")
    public ResponseEntity<ApiResponse<HabilitationResponseDTO>> revoquerHabilitation(@PathVariable Long id) {
        Habilitation habilitation = habilitationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habilitation non trouvée avec l'id : " + id));

        if (habilitation.getStatut() == HabilitationStatut.REVOQUEE) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Cette habilitation est déjà révoquée"));
        }

        habilitation.setStatut(HabilitationStatut.REVOQUEE);
        habilitation.setDateRevocation(LocalDateTime.now());
        habilitationRepository.save(habilitation);

        return ResponseEntity.ok(ApiResponse.ok("Habilitation révoquée",
                badgeService.toHabilitationResponseDTO(habilitation)));
    }
}
