package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.*;
import ma.ram.sigba.exception.BusinessException;
import ma.ram.sigba.service.KeycloakService;
import ma.ram.sigba.service.EmailService;
import ma.ram.sigba.service.UserService;
import ma.ram.sigba.util.SecureTokenUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Profil utilisateur et gestion du mot de passe")
public class AuthController {

    private final UserService userService;
    private final KeycloakService keycloakService;
    private final EmailService emailService;

    @GetMapping("/me")
    @Operation(summary = "Profil utilisateur connecté")
    public ResponseEntity<ApiResponse<UserResponseDTO>> me() {
        UserResponseDTO profile = userService.getCurrentUserProfile();
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @GetMapping("/preferences")
    @Operation(summary = "Préférences de l'utilisateur connecté")
    public ResponseEntity<ApiResponse<UserPreferencesDTO>> getPreferences() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getPreferences()));
    }

    @PutMapping("/preferences")
    @Operation(summary = "Mettre à jour les préférences")
    public ResponseEntity<ApiResponse<UserPreferencesDTO>> updatePreferences(
            @Valid @RequestBody UserPreferencesDTO request) {
        return ResponseEntity.ok(ApiResponse.ok(userService.updatePreferences(request)));
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
        if (keycloakService.utilisateurExiste(request.getEmail())) {
            emailService.envoyerEmailReinitialisationMotDePasse(request.getEmail());
        }
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
