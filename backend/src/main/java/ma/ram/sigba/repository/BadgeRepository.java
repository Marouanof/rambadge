package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Badge;
import ma.ram.sigba.entity.enums.BadgeStatut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    Optional<Badge> findByEmployeId(Long employeId);
    Optional<Badge> findFirstByEmployeIdAndStatutIn(Long employeId, java.util.List<BadgeStatut> statuts);
    Optional<Badge> findByDemandeId(Long demandeId);
    Optional<Badge> findByUidUnique(String uidUnique);
    Page<Badge> findByStatut(BadgeStatut statut, Pageable pageable);
    Page<Badge> findByEmployeDirectionId(Long directionId, Pageable pageable);
    boolean existsByEmployeIdAndStatutIn(Long employeId, java.util.List<BadgeStatut> statuts);
}
