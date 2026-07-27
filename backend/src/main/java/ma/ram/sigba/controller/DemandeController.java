package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.*;
import ma.ram.sigba.service.DemandeService;
import ma.ram.sigba.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/demandes")
@RequiredArgsConstructor
@Tag(name = "Demandes de Badge", description = "Workflow de demande : soumission, validation N1/N2, pièces justificatives")
public class DemandeController {

    private final DemandeService demandeService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYE')")
    @Operation(summary = "Soumettre une demande de badge", description = "L'employé soumet ses pièces justificatives pour obtenir un badge.")
    public ResponseEntity<ApiResponse<DemandeResponseDTO>> soumettreDemande(
            @Valid @RequestBody SoumettreDemandeRequestDTO request) {
        var employe = userService.getCurrentUser();
        DemandeResponseDTO demande = demandeService.soumettreDemande(request, employe);
        return ResponseEntity.ok(ApiResponse.ok("Demande soumise avec succès", demande));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYE', 'MANAGER', 'AGENT_SURETE', 'SUPER_ADMIN')")
    @Operation(summary = "Lister les demandes", description = "Selon le rôle : employé=les siennes, manager=sa direction, sûreté=à instruire (N2).")
    public ResponseEntity<ApiResponse<Page<DemandeResponseDTO>>> listerDemandes(
            @PageableDefault(size = 20) Pageable pageable) {
        var user = userService.getCurrentUser();
        Page<DemandeResponseDTO> demandes = demandeService.listerDemandes(user, pageable);
        return ResponseEntity.ok(ApiResponse.ok(demandes));
    }

    @GetMapping("/toutes")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Toutes les demandes", description = "Consultation globale — SUPER_ADMIN uniquement, sans filtre par rôle.")
    public ResponseEntity<ApiResponse<Page<DemandeResponseDTO>>> listerToutesLesDemandes(
            @PageableDefault(size = 50) Pageable pageable) {
        Page<DemandeResponseDTO> demandes = demandeService.listerToutesLesDemandes(pageable);
        return ResponseEntity.ok(ApiResponse.ok(demandes));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYE', 'MANAGER', 'AGENT_SURETE', 'SUPER_ADMIN')")
    @Operation(summary = "Détail d'une demande")
    public ResponseEntity<ApiResponse<DemandeResponseDTO>> getDemande(@PathVariable Long id) {
        var user = userService.getCurrentUser();
        DemandeResponseDTO demande = demandeService.getDemandeById(id, user);
        return ResponseEntity.ok(ApiResponse.ok(demande));
    }

    @GetMapping("/{id}/pieces")
    @PreAuthorize("hasAnyRole('EMPLOYE', 'MANAGER', 'AGENT_SURETE', 'SUPER_ADMIN')")
    @Operation(summary = "Pièces justificatives d'une demande")
    public ResponseEntity<ApiResponse<List<DemandeResponseDTO.PieceJustificativeResponseDTO>>> listerPieces(
            @PathVariable Long id) {
        List<DemandeResponseDTO.PieceJustificativeResponseDTO> pieces = demandeService.listerPieces(id);
        return ResponseEntity.ok(ApiResponse.ok(pieces));
    }

    @PostMapping("/{id}/validate-n1")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Validation N1 — Manager", description = "Pré-approuve la demande et sélectionne les zones d'accès nécessaires.")
    public ResponseEntity<ApiResponse<DemandeResponseDTO>> validerN1(
            @PathVariable Long id,
            @Valid @RequestBody ValiderN1RequestDTO request) {
        var manager = userService.getCurrentUser();
        DemandeResponseDTO demande = demandeService.validerN1(id, request, manager);
        return ResponseEntity.ok(ApiResponse.ok("Validation N1 réussie", demande));
    }

    @PostMapping("/{id}/refuse-n1")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Refus N1 — Manager", description = "Refuse la demande avec un motif obligatoire.")
    public ResponseEntity<ApiResponse<DemandeResponseDTO>> refuserN1(
            @PathVariable Long id,
            @Valid @RequestBody RefuserRequestDTO request) {
        var manager = userService.getCurrentUser();
        DemandeResponseDTO demande = demandeService.refuserN1(id, request, manager);
        return ResponseEntity.ok(ApiResponse.ok("Demande refusée au N1", demande));
    }

    @PostMapping("/{id}/validate-n2")
    @PreAuthorize("hasRole('AGENT_SURETE')")
    @Operation(summary = "Validation N2 — Agent de Sûreté", description = "Valide définitivement, génère le badge + UID, octroie les habilitations.")
    public ResponseEntity<ApiResponse<DemandeResponseDTO>> validerN2(
            @PathVariable Long id,
            @Valid @RequestBody ValiderN2RequestDTO request) {
        var agent = userService.getCurrentUser();
        DemandeResponseDTO demande = demandeService.validerN2(id, request, agent);
        return ResponseEntity.ok(ApiResponse.ok("Validation N2 réussie — Badge émis", demande));
    }

    @PostMapping("/{id}/refuse-n2")
    @PreAuthorize("hasRole('AGENT_SURETE')")
    @Operation(summary = "Refus N2 — Agent de Sûreté", description = "Refus définitif avec motif obligatoire.")
    public ResponseEntity<ApiResponse<DemandeResponseDTO>> refuserN2(
            @PathVariable Long id,
            @Valid @RequestBody RefuserRequestDTO request) {
        var agent = userService.getCurrentUser();
        DemandeResponseDTO demande = demandeService.refuserN2(id, request, agent);
        return ResponseEntity.ok(ApiResponse.ok("Demande refusée au N2", demande));
    }
}
