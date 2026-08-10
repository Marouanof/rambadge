package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.dto.NotificationResponseDTO;
import ma.ram.sigba.service.NotificationService;
import ma.ram.sigba.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notifications utilisateur — lecture, marquage lu, compteur")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister les notifications de l'utilisateur")
    public ResponseEntity<ApiResponse<Page<NotificationResponseDTO>>> listerNotifications(
            @PageableDefault(size = 20) Pageable pageable) {
        var user = userService.getCurrentUser();
        Page<NotificationResponseDTO> notifications = notificationService.listerNotifications(user, pageable);
        return ResponseEntity.ok(ApiResponse.ok(notifications));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Nombre de notifications non lues")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        var user = userService.getCurrentUser();
        long count = notificationService.getUnreadCount(user);
        return ResponseEntity.ok(ApiResponse.ok(count));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Marquer une notification comme lue")
    public ResponseEntity<ApiResponse<NotificationResponseDTO>> marquerCommeLue(@PathVariable Long id) {
        var user = userService.getCurrentUser();
        NotificationResponseDTO notification = notificationService.marquerCommeLue(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Notification marquée comme lue", notification));
    }

    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Tout marquer comme lu")
    public ResponseEntity<ApiResponse<Integer>> marquerToutCommeLu() {
        var user = userService.getCurrentUser();
        int count = notificationService.marquerToutCommeLu(user);
        return ResponseEntity.ok(ApiResponse.ok(count + " notification(s) marquée(s) comme lue(s)", count));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Supprimer une notification")
    public ResponseEntity<ApiResponse<Void>> supprimerNotification(@PathVariable Long id) {
        var user = userService.getCurrentUser();
        notificationService.supprimerNotification(id, user);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Supprimer toutes les notifications")
    public ResponseEntity<ApiResponse<Integer>> supprimerToutesNotifications() {
        var user = userService.getCurrentUser();
        int count = notificationService.supprimerToutesNotifications(user);
        return ResponseEntity.ok(ApiResponse.ok(count + " notification(s) supprimée(s)", count));
    }
}
