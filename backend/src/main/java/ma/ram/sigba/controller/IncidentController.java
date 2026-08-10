package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.dto.IncidentResponseDTO;
import ma.ram.sigba.dto.SignalerIncidentRequestDTO;
import ma.ram.sigba.entity.enums.IncidentStatut;
import ma.ram.sigba.entity.enums.TypeIncident;
import ma.ram.sigba.service.IncidentService;
import ma.ram.sigba.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
@Tag(name = "Incidents & Révocations", description = "Signalement d'incidents, révocation ou levée de suspension des badges")
public class IncidentController {

    private final IncidentService incidentService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYE', 'MANAGER', 'SUPER_ADMIN')")
    @Operation(summary = "Signaler un incident", description = "Perte, vol ou fin de contrat — suspend le badge automatiquement")
    public ResponseEntity<ApiResponse<IncidentResponseDTO>> signalerIncident(
            @Valid @RequestBody SignalerIncidentRequestDTO request) {
        var signalant = userService.getCurrentUser();
        IncidentResponseDTO incident = incidentService.signalerIncident(request, signalant);
        return ResponseEntity.ok(ApiResponse.ok("Incident signalé — badge suspendu", incident));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'AGENT_SURETE', 'EMPLOYE')")
    @Operation(summary = "Lister les incidents", description = "SUPER_ADMIN=tous, MANAGER=direction, AGENT=suspendus, EMPLOYE=les siens")
    public ResponseEntity<ApiResponse<Page<IncidentResponseDTO>>> listerIncidents(
            @RequestParam(required = false) IncidentStatut statut,
            @RequestParam(required = false) TypeIncident type,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        var user = userService.getCurrentUser();
        Page<IncidentResponseDTO> incidents = incidentService.listerIncidents(user, statut, type, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(incidents));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'AGENT_SURETE', 'EMPLOYE')")
    @Operation(summary = "Détail d'un incident")
    public ResponseEntity<ApiResponse<IncidentResponseDTO>> getIncident(@PathVariable Long id) {
        IncidentResponseDTO incident = incidentService.getIncidentById(id);
        return ResponseEntity.ok(ApiResponse.ok(incident));
    }

    @PatchMapping("/{id}/confirm-revoke")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENT_SURETE')")
    @Operation(summary = "Confirmer la révocation", description = "Révoque définitivement le badge suite à l'incident")
    public ResponseEntity<ApiResponse<IncidentResponseDTO>> confirmerRevocation(@PathVariable Long id) {
        var agent = userService.getCurrentUser();
        IncidentResponseDTO incident = incidentService.confirmerRevocation(id, agent);
        return ResponseEntity.ok(ApiResponse.ok("Révocation confirmée — badge révoqué", incident));
    }

    @PatchMapping("/{id}/lift-suspension")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENT_SURETE')")
    @Operation(summary = "Lever la suspension", description = "Réactive le badge si l'incident est résolu")
    public ResponseEntity<ApiResponse<IncidentResponseDTO>> leverSuspension(@PathVariable Long id) {
        var agent = userService.getCurrentUser();
        IncidentResponseDTO incident = incidentService.leverSuspension(id, agent);
        return ResponseEntity.ok(ApiResponse.ok("Suspension levée — badge réactivé", incident));
    }
}
