package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.NotificationResponseDTO;
import ma.ram.sigba.entity.Notification;
import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.enums.TypeNotification;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Page<NotificationResponseDTO> listerNotifications(User user, Pageable pageable) {
        return notificationRepository.findByDestinataireIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::toResponseDTO);
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByDestinataireIdAndLuFalse(user.getId());
    }

    @Transactional
    public NotificationResponseDTO marquerCommeLue(Long id, User user) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification non trouvée avec l'id : " + id));

        if (!notification.getDestinataire().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Notification non trouvée");
        }

        notification.setLu(true);
        notificationRepository.save(notification);
        return toResponseDTO(notification);
    }

    @Transactional
    public int marquerToutCommeLu(User user) {
        int count = notificationRepository.markAllAsRead(user.getId());
        log.info("Notifications marquées comme lues pour {} : {}", user.getEmail(), count);
        return count;
    }

    @Transactional
    public void supprimerNotification(Long id, User user) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification non trouvée avec l'id : " + id));

        if (!notification.getDestinataire().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Notification non trouvée");
        }

        notificationRepository.delete(notification);
        log.info("Notification {} supprimée pour {}", id, user.getEmail());
    }

    @Transactional
    public int supprimerToutesNotifications(User user) {
        int count = notificationRepository.deleteByDestinataireId(user.getId());
        log.info("Toutes les notifications supprimées pour {} : {}", user.getEmail(), count);
        return count;
    }

    public void creerNotification(User destinataire, TypeNotification type, String message, String lienElement) {
        Notification notification = Notification.builder()
                .destinataire(destinataire)
                .typeNotification(type)
                .message(message)
                .lienElement(lienElement)
                .build();
        notificationRepository.save(notification);
        log.info("Notification créée pour {} : type={}", destinataire.getEmail(), type);
    }

    private NotificationResponseDTO toResponseDTO(Notification n) {
        return NotificationResponseDTO.builder()
                .id(n.getId())
                .typeNotification(n.getTypeNotification().name())
                .message(n.getMessage())
                .lu(n.getLu())
                .lienElement(n.getLienElement())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
