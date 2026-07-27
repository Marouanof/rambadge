package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.dto.DirectionRequestDTO;
import ma.ram.sigba.dto.DirectionResponseDTO;
import ma.ram.sigba.dto.UserResponseDTO;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.service.DirectionService;
import ma.ram.sigba.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/directions")
@RequiredArgsConstructor
@Tag(name = "Directions", description = "Gestion des directions / services RAM (Super-Admin)")
public class DirectionController {

    private final DirectionService directionService;
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Lister les directions", description = "Liste paginée des directions avec recherche et filtre par statut.")
    public ResponseEntity<ApiResponse<Page<DirectionResponseDTO>>> listerDirections(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String statut,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<DirectionResponseDTO> directions = directionService.listerDirections(search, statut, pageable);
        return ResponseEntity.ok(ApiResponse.ok(directions));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Détail d'une direction")
    public ResponseEntity<ApiResponse<DirectionResponseDTO>> getDirection(@PathVariable Long id) {
        DirectionResponseDTO direction = directionService.getDirectionById(id);
        return ResponseEntity.ok(ApiResponse.ok(direction));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Créer une direction")
    public ResponseEntity<ApiResponse<DirectionResponseDTO>> creerDirection(
            @Valid @RequestBody DirectionRequestDTO request) {
        var auteur = userService.getCurrentUser();
        DirectionResponseDTO direction = directionService.creerDirection(request, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Direction créée avec succès", direction));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Modifier une direction")
    public ResponseEntity<ApiResponse<DirectionResponseDTO>> modifierDirection(
            @PathVariable Long id,
            @Valid @RequestBody DirectionRequestDTO request) {
        var auteur = userService.getCurrentUser();
        DirectionResponseDTO direction = directionService.modifierDirection(id, request, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Direction modifiée avec succès", direction));
    }

    @PatchMapping("/{id}/disable")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Désactiver une direction")
    public ResponseEntity<ApiResponse<DirectionResponseDTO>> desactiverDirection(@PathVariable Long id) {
        var auteur = userService.getCurrentUser();
        DirectionResponseDTO direction = directionService.desactiverDirection(id, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Direction désactivée avec succès", direction));
    }

    @PatchMapping("/{id}/enable")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Activer une direction")
    public ResponseEntity<ApiResponse<DirectionResponseDTO>> activerDirection(@PathVariable Long id) {
        var auteur = userService.getCurrentUser();
        DirectionResponseDTO direction = directionService.activerDirection(id, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Direction activée avec succès", direction));
    }

    @GetMapping("/{id}/employes")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Employés d'une direction")
    public ResponseEntity<ApiResponse<Page<UserResponseDTO>>> listerEmployes(
            @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<UserResponseDTO> employes = directionService.listerEmployesParDirection(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(employes));
    }
}
