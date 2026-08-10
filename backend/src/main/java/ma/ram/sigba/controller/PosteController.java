package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.dto.PosteRequestDTO;
import ma.ram.sigba.dto.PosteResponseDTO;
import ma.ram.sigba.service.PosteService;
import ma.ram.sigba.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/postes")
@RequiredArgsConstructor
@Tag(name = "Postes", description = "Gestion des postes par direction (Manager)")
public class PosteController {

    private final PosteService posteService;
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Lister les postes de ma direction")
    public ResponseEntity<ApiResponse<List<PosteResponseDTO>>> listerPostes() {
        var auteur = userService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(posteService.listerPostesDirectionManager(auteur)));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Créer un poste dans ma direction")
    public ResponseEntity<ApiResponse<PosteResponseDTO>> creerPoste(
            @Valid @RequestBody PosteRequestDTO request) {
        var auteur = userService.getCurrentUser();
        PosteResponseDTO poste = posteService.creerPoste(request, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Poste créé avec succès", poste));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Supprimer un poste de ma direction")
    public ResponseEntity<ApiResponse<Void>> supprimerPoste(@PathVariable Long id) {
        var auteur = userService.getCurrentUser();
        posteService.supprimerPoste(id, auteur);
        return ResponseEntity.ok(ApiResponse.ok("Poste supprimé avec succès", null));
    }
}
