package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.dto.UpdateProfileRequestDTO;
import ma.ram.sigba.dto.UserResponseDTO;
import ma.ram.sigba.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employes")
@RequiredArgsConstructor
@Tag(name = "Employés", description = "Gestion des employés RAM (Super-Admin, Manager, Employé)")
public class EmployeController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Lister tous les employés", description = "Vue globale pour le Super-Admin avec recherche et filtre par statut.")
    public ResponseEntity<ApiResponse<Page<UserResponseDTO>>> listerEmployes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String statut,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<UserResponseDTO> employes = userService.listerEmployes(search, statut, pageable);
        return ResponseEntity.ok(ApiResponse.ok(employes));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER')")
    @Operation(summary = "Détail d'un employé")
    public ResponseEntity<ApiResponse<UserResponseDTO>> getEmploye(@PathVariable Long id) {
        UserResponseDTO employe = userService.getEmployeById(id);
        return ResponseEntity.ok(ApiResponse.ok(employe));
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Modifier son profil", description = "L'utilisateur met à jour son nom, prénom et photo.")
    public ResponseEntity<ApiResponse<UserResponseDTO>> updateProfile(
            @Valid @RequestBody UpdateProfileRequestDTO request) {
        UserResponseDTO profile = userService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.ok("Profil mis à jour avec succès", profile));
    }
}
