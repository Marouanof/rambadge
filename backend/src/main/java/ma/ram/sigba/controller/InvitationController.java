package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.AcceptInvitationRequestDTO;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.dto.InvitationRequestDTO;
import ma.ram.sigba.dto.InvitationResponseDTO;
import ma.ram.sigba.service.InvitationService;
import ma.ram.sigba.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
@Tag(name = "Invitations", description = "Gestion des invitations employés (Manager)")
public class InvitationController {

    private final InvitationService invitationService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Générer une invitation", description = "Génère un code unique et envoie un email d'invitation via Mailtrap.")
    public ResponseEntity<ApiResponse<InvitationResponseDTO>> genererInvitation(
            @Valid @RequestBody InvitationRequestDTO request) {
        var auteur = userService.getCurrentUser();
        InvitationResponseDTO invitation = invitationService.genererInvitation(request, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Invitation générée avec succès", invitation));
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Lister les invitations", description = "Invitations de la direction du manager connecté.")
    public ResponseEntity<ApiResponse<Page<InvitationResponseDTO>>> listerInvitations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String statut,
            @PageableDefault(size = 20) Pageable pageable) {
        var auteur = userService.getCurrentUser();
        Page<InvitationResponseDTO> invitations = invitationService.listerInvitations(search, statut, auteur, pageable);
        return ResponseEntity.ok(ApiResponse.ok(invitations));
    }

    @GetMapping("/{code}")
    @Operation(summary = "Récupérer une invitation par code", description = "Endpoint public — vérifie la validité du code d'invitation.")
    public ResponseEntity<ApiResponse<InvitationResponseDTO>> getInvitationByCode(@PathVariable String code) {
        InvitationResponseDTO invitation = invitationService.getInvitationByCode(code);
        return ResponseEntity.ok(ApiResponse.ok(invitation));
    }

    @PostMapping("/{code}/accept")
    @Operation(summary = "Accepter une invitation", description = "Crée le compte employé + Keycloak + rattache à la direction.")
    public ResponseEntity<ApiResponse<InvitationResponseDTO>> accepterInvitation(
            @PathVariable String code,
            @Valid @RequestBody AcceptInvitationRequestDTO request) {
        InvitationResponseDTO invitation = invitationService.accepterInvitation(code, request);
        return ResponseEntity.ok(ApiResponse.ok("Invitation acceptée avec succès", invitation));
    }

    @PatchMapping("/{id}/revoke")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Révoquer une invitation")
    public ResponseEntity<ApiResponse<InvitationResponseDTO>> revoquerInvitation(@PathVariable Long id) {
        var auteur = userService.getCurrentUser();
        InvitationResponseDTO invitation = invitationService.revoquerInvitation(id, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Invitation révoquée avec succès", invitation));
    }
}
