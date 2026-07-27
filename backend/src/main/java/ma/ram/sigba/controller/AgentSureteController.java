package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.AgentSureteRequestDTO;
import ma.ram.sigba.dto.AgentSureteResponseDTO;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.service.AgentSureteService;
import ma.ram.sigba.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/agents-surete")
@RequiredArgsConstructor
@Tag(name = "Agents de Sûreté", description = "Gestion des comptes agents de sûreté (Super-Admin)")
public class AgentSureteController {

    private final AgentSureteService agentSureteService;
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Lister les agents de sûreté")
    public ResponseEntity<ApiResponse<Page<AgentSureteResponseDTO>>> listerAgents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String statut,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AgentSureteResponseDTO> agents = agentSureteService.listerAgents(search, statut, pageable);
        return ResponseEntity.ok(ApiResponse.ok(agents));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Détail d'un agent de sûreté")
    public ResponseEntity<ApiResponse<AgentSureteResponseDTO>> getAgent(@PathVariable Long id) {
        AgentSureteResponseDTO agent = agentSureteService.getAgentById(id);
        return ResponseEntity.ok(ApiResponse.ok(agent));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Créer un agent de sûreté", description = "Crée le compte Keycloak + enregistre en BDD.")
    public ResponseEntity<ApiResponse<AgentSureteResponseDTO>> creerAgent(
            @Valid @RequestBody AgentSureteRequestDTO request) {
        var auteur = userService.getCurrentUser();
        AgentSureteResponseDTO agent = agentSureteService.creerAgent(request, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Agent de sûreté créé avec succès", agent));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Modifier un agent de sûreté")
    public ResponseEntity<ApiResponse<AgentSureteResponseDTO>> modifierAgent(
            @PathVariable Long id,
            @Valid @RequestBody AgentSureteRequestDTO request) {
        var auteur = userService.getCurrentUser();
        AgentSureteResponseDTO agent = agentSureteService.modifierAgent(id, request, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Agent de sûreté modifié avec succès", agent));
    }

    @PatchMapping("/{id}/revoke")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Révoquer un agent de sûreté")
    public ResponseEntity<ApiResponse<AgentSureteResponseDTO>> revoquerAgent(@PathVariable Long id) {
        var auteur = userService.getCurrentUser();
        AgentSureteResponseDTO agent = agentSureteService.revoquerAgent(id, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Agent de sûreté révoqué avec succès", agent));
    }

    @PatchMapping("/{id}/enable")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Réactiver un agent de sûreté")
    public ResponseEntity<ApiResponse<AgentSureteResponseDTO>> reactiverAgent(@PathVariable Long id) {
        var auteur = userService.getCurrentUser();
        AgentSureteResponseDTO agent = agentSureteService.reactiverAgent(id, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Agent de sûreté réactivé avec succès", agent));
    }
}
