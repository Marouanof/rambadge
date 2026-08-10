package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.*;
import ma.ram.sigba.entity.enums.ResultatPassage;
import ma.ram.sigba.service.PassageService;
import ma.ram.sigba.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/passages")
@RequiredArgsConstructor
@Tag(name = "Passages & Historique", description = "Enregistrement, historique, simulation de passages de badges")
public class PassageController {

    private final PassageService passageService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENT_SURETE', 'EMPLOYE')")
    @Operation(summary = "Enregistrer un passage", description = "UID badge + zone → AUTORISÉ ou REFUSÉ")
    public ResponseEntity<ApiResponse<PassageResponseDTO>> enregistrerPassage(
            @RequestParam String uidBadge,
            @RequestParam Long zoneId) {
        var user = userService.getCurrentUser();
        PassageResponseDTO passage = passageService.enregistrerPassage(uidBadge, zoneId, user);
        return ResponseEntity.ok(ApiResponse.ok(passage));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'AGENT_SURETE', 'EMPLOYE')")
    @Operation(summary = "Historique des passages", description = "Filtrage par zone/employé/période pour SUPER_ADMIN ; par direction pour MANAGER/AGENT ; personnel pour EMPLOYE")
    public ResponseEntity<ApiResponse<Page<PassageResponseDTO>>> listerPassages(
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Long employeId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String zone,
            @RequestParam(required = false) String resultat,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin,
            @PageableDefault(size = 20) Pageable pageable) {
        var user = userService.getCurrentUser();
        ResultatPassage resultatPassage = null;
        if (resultat != null && !resultat.isBlank()) {
            resultatPassage = ResultatPassage.valueOf(resultat.toUpperCase());
        }
        LocalDateTime debut = dateDebut != null ? dateDebut.atStartOfDay() : null;
        LocalDateTime fin = dateFin != null ? dateFin.atTime(LocalTime.MAX) : null;
        Page<PassageResponseDTO> passages = passageService.listerPassages(
                user, zoneId, employeId, search, direction, zone, resultatPassage, debut, fin, pageable);
        return ResponseEntity.ok(ApiResponse.ok(passages));
    }

    @GetMapping("/personal")
    @PreAuthorize("hasRole('EMPLOYE')")
    @Operation(summary = "Historique personnel des passages (Employé)")
    public ResponseEntity<ApiResponse<Page<PassageResponseDTO>>> listerPassagesPersonnels(
            @PageableDefault(size = 20) Pageable pageable) {
        var user = userService.getCurrentUser();
        Page<PassageResponseDTO> passages = passageService.listerPassagesPersonnels(user, pageable);
        return ResponseEntity.ok(ApiResponse.ok(passages));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'AGENT_SURETE', 'EMPLOYE')")
    @Operation(summary = "Détail d'un passage")
    public ResponseEntity<ApiResponse<PassageResponseDTO>> getPassage(@PathVariable Long id) {
        PassageResponseDTO passage = passageService.getPassageById(id);
        return ResponseEntity.ok(ApiResponse.ok(passage));
    }

    @PostMapping("/simulate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENT_SURETE')")
    @Operation(summary = "Simuler un passage", description = "Teste l'UID badge + zone → Autorisé/Refusé avec motif sans enregistrer")
    public ResponseEntity<ApiResponse<SimulationResponseDTO>> simulerPassage(
            @Valid @RequestBody SimulatePassageRequestDTO request) {
        SimulationResponseDTO simulation = passageService.simulerPassage(request.getUidBadge(), request.getZoneId());
        return ResponseEntity.ok(ApiResponse.ok(simulation));
    }
}
