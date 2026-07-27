package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.*;
import ma.ram.sigba.exception.BusinessException;
import ma.ram.sigba.service.KeycloakService;
import ma.ram.sigba.service.UserService;
import ma.ram.sigba.util.SecureTokenUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Profile utilisateur et gestion du mot de passe")
public class AuthController {

    private final UserService userService;
    private final KeycloakService keycloakService;

    @GetMapping("/me")
    @Operation(summary = "Profile utilisateur connecté")
    public ResponseEntity<ApiResponse<UserResponseDTO>> me() {
        UserResponseDTO profile = userService.getCurrentUserProfile();
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PostMapping("/set-password")
    @Operation(summary = "Définir le mot de passe via token d'activation")
    public ResponseEntity<ApiResponse<Void>> setPassword(
            @Valid @RequestBody SetPasswordRequestDTO request) {
        String email = SecureTokenUtil.validateToken(request.getToken());
        if (email == null) {
            throw new BusinessException("Le lien est invalide ou a expiré");
        }
        keycloakService.reinitialiserMotDePasse(email, request.getNouveauMotDePasse());
        return ResponseEntity.ok(ApiResponse.ok("Mot de passe défini avec succès", null));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Demander la réinitialisation du mot de passe")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequestDTO request) {
        keycloakService.envoyerEmailReinitialisationMotDePasse(request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Email de réinitialisation envoyé", null));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Réinitialiser le mot de passe")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequestDTO request) {
        keycloakService.reinitialiserMotDePasse(request.getEmail(), request.getNouveauMotDePasse());
        return ResponseEntity.ok(ApiResponse.ok("Mot de passe réinitialisé avec succès", null));
    }
}
