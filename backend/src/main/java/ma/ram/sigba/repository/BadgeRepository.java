package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Badge;
import ma.ram.sigba.entity.enums.BadgeStatut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    Optional<Badge> findByEmployeId(Long employeId);
    Optional<Badge> findByDemandeId(Long demandeId);
    Optional<Badge> findByUidUnique(String uidUnique);
    Page<Badge> findByStatut(BadgeStatut statut, Pageable pageable);
    Page<Badge> findByEmployeDirectionId(Long directionId, Pageable pageable);
    long countByEmployeDirectionId(Long directionId);
    long countByEmployeDirectionIdAndStatut(Long directionId, BadgeStatut statut);
    boolean existsByEmployeIdAndStatutIn(Long employeId, java.util.List<BadgeStatut> statuts);

    Page<Badge> findByStatutAndDateExpirationBetweenOrderByDateExpirationAsc(BadgeStatut statut, LocalDateTime start, LocalDateTime end, Pageable pageable);

    long countByEmployeDirectionIdAndStatutAndDateExpirationBetween(
            Long directionId, BadgeStatut statut, LocalDateTime start, LocalDateTime end);

    @Query("SELECT b FROM Badge b "
            + "LEFT JOIN b.employe e "
            + "LEFT JOIN e.direction dir WHERE "
            + "(CAST(:search AS string) IS NULL OR LOWER(e.nom) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') "
            + "  OR LOWER(e.prenom) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') "
            + "  OR LOWER(e.email) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') "
            + "  OR LOWER(e.matricule) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') "
            + "  OR LOWER(b.uidUnique) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%')) "
            + "AND (CAST(:direction AS string) IS NULL OR LOWER(dir.nom) LIKE CONCAT('%', LOWER(CAST(:direction AS string)), '%')) "
            + "AND (CAST(:statut AS string) IS NULL OR b.statut = :statut) "
            + "AND (CAST(:dateDebut AS timestamp) IS NULL OR b.createdAt >= :dateDebut) "
            + "AND (CAST(:dateFin AS timestamp) IS NULL OR b.createdAt <= :dateFin)")
    Page<Badge> search(@Param("search") String search,
                       @Param("direction") String direction,
                       @Param("statut") BadgeStatut statut,
                       @Param("dateDebut") LocalDateTime dateDebut,
                       @Param("dateFin") LocalDateTime dateFin,
                       Pageable pageable);

    @Query("SELECT b.employe.direction.nom, COUNT(b) FROM Badge b GROUP BY b.employe.direction.nom ORDER BY COUNT(b) DESC")
    List<Object[]> countParDirection();
}
