package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Habilitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HabilitationRepository extends JpaRepository<Habilitation, Long> {
    List<Habilitation> findByBadgeId(Long badgeId);
}
