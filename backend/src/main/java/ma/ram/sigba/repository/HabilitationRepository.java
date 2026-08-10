package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Habilitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface HabilitationRepository extends JpaRepository<Habilitation, Long> {
    List<Habilitation> findByBadgeId(Long badgeId);

    @Query("SELECT h.zone.nom, COUNT(h) FROM Habilitation h "
            + "WHERE h.statut = ma.ram.sigba.entity.enums.HabilitationStatut.ACTIVE "
            + "AND h.badge.statut = ma.ram.sigba.entity.enums.BadgeStatut.ACTIF "
            + "GROUP BY h.zone.nom ORDER BY COUNT(h) DESC")
    List<Object[]> countBadgesActifsParZone();
}
