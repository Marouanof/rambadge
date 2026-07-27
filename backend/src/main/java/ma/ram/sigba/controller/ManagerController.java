package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.dto.ManagerRequestDTO;
import ma.ram.sigba.dto.ManagerResponseDTO;
import ma.ram.sigba.dto.UserResponseDTO;
import ma.ram.sigba.service.ManagerService;
import ma.ram.sigba.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/managers")
@RequiredArgsConstructor
@Tag(name = "Managers", description = "Gestion des managers de direction (Super-Admin + endpoints Manager)")
public class ManagerController {

    private final ManagerService managerService;
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Lister les managers")
    public ResponseEntity<ApiResponse<Page<ManagerResponseDTO>>> listerManagers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String statut,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ManagerResponseDTO> managers = managerService.listerManagers(search, statut, pageable);
        return ResponseEntity.ok(ApiResponse.ok(managers));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Détail d'un manager")
    public ResponseEntity<ApiResponse<ManagerResponseDTO>> getManager(@PathVariable Long id) {
        ManagerResponseDTO manager = managerService.getManagerById(id);
        return ResponseEntity.ok(ApiResponse.ok(manager));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Créer un manager", description = "Crée le compte Keycloak + assigne la direction.")
    public ResponseEntity<ApiResponse<ManagerResponseDTO>> creerManager(
            @Valid @RequestBody ManagerRequestDTO request) {
        var auteur = userService.getCurrentUser();
        ManagerResponseDTO manager = managerService.creerManager(request, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Manager créé avec succès. Email d'activation envoyé.", manager));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Modifier un manager")
    public ResponseEntity<ApiResponse<ManagerResponseDTO>> modifierManager(
            @PathVariable Long id,
            @Valid @RequestBody ManagerRequestDTO request) {
        var auteur = userService.getCurrentUser();
        ManagerResponseDTO manager = managerService.modifierManager(id, request, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Manager modifié avec succès", manager));
    }

    @PatchMapping("/{id}/revoke")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Révoquer un manager", description = "Détache la direction et désactive le compte.")
    public ResponseEntity<ApiResponse<ManagerResponseDTO>> revoquerManager(@PathVariable Long id) {
        var auteur = userService.getCurrentUser();
        ManagerResponseDTO manager = managerService.revoquerManager(id, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Manager révoqué avec succès", manager));
    }

    @PatchMapping("/{id}/enable")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Réactiver un manager")
    public ResponseEntity<ApiResponse<ManagerResponseDTO>> reactiverManager(@PathVariable Long id) {
        var auteur = userService.getCurrentUser();
        ManagerResponseDTO manager = managerService.reactiverManager(id, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Manager réactivé avec succès", manager));
    }

    @GetMapping("/mes-employes")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Employés de ma direction", description = "Retourne les employés de la direction du manager connecté. avecBadge=true pour ne garder que ceux ayant un badge.")
    public ResponseEntity<ApiResponse<Page<UserResponseDTO>>> listerMesEmployes(
            @RequestParam(required = false, defaultValue = "false") boolean avecBadge,
            @PageableDefault(size = 20) Pageable pageable) {
        var manager = userService.getCurrentUser();
        Page<UserResponseDTO> employes = managerService.listerMesEmployes(manager, avecBadge, pageable);
        return ResponseEntity.ok(ApiResponse.ok(employes));
    }
}
