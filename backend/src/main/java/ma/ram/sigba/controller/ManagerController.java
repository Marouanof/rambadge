package ma.ram.sigba.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.dto.ManagerRequestDTO;
import ma.ram.sigba.dto.ManagerResponseDTO;
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
public class ManagerController {

    private final ManagerService managerService;
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<ManagerResponseDTO>>> listerManagers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String statut,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ManagerResponseDTO> managers = managerService.listerManagers(search, statut, pageable);
        return ResponseEntity.ok(ApiResponse.ok(managers));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ManagerResponseDTO>> getManager(@PathVariable Long id) {
        ManagerResponseDTO manager = managerService.getManagerById(id);
        return ResponseEntity.ok(ApiResponse.ok(manager));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ManagerResponseDTO>> creerManager(
            @Valid @RequestBody ManagerRequestDTO request) {
        var auteur = userService.getCurrentUser();
        ManagerResponseDTO manager = managerService.creerManager(request, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Manager créé avec succès. Email d'activation envoyé.", manager));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ManagerResponseDTO>> modifierManager(
            @PathVariable Long id,
            @Valid @RequestBody ManagerRequestDTO request) {
        var auteur = userService.getCurrentUser();
        ManagerResponseDTO manager = managerService.modifierManager(id, request, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Manager modifié avec succès", manager));
    }

    @PatchMapping("/{id}/revoke")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ManagerResponseDTO>> revoquerManager(@PathVariable Long id) {
        var auteur = userService.getCurrentUser();
        ManagerResponseDTO manager = managerService.revoquerManager(id, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Manager révoqué avec succès", manager));
    }

    @PatchMapping("/{id}/enable")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ManagerResponseDTO>> reactiverManager(@PathVariable Long id) {
        var auteur = userService.getCurrentUser();
        ManagerResponseDTO manager = managerService.reactiverManager(id, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Manager réactivé avec succès", manager));
    }
}
