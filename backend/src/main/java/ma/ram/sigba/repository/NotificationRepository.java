package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByDestinataireIdOrderByCreatedAtDesc(Long destinataireId, Pageable pageable);
    long countByDestinataireIdAndLuFalse(Long destinataireId);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true WHERE n.destinataire.id = :userId AND n.lu = false")
    int markAllAsRead(Long userId);
}
