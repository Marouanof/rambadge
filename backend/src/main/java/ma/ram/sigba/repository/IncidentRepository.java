package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Incident;
import ma.ram.sigba.entity.enums.IncidentStatut;
import ma.ram.sigba.entity.enums.TypeIncident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    Page<Incident> findBySignalantIdOrderByDateIncidentDesc(Long signalantId, Pageable pageable);
    Page<Incident> findByBadgeEmployeDirectionIdOrderByDateIncidentDesc(Long directionId, Pageable pageable);
    Page<Incident> findByBadgeEmployeDirectionIdAndStatutOrderByDateIncidentDesc(Long directionId, IncidentStatut statut, Pageable pageable);
    Page<Incident> findByStatutOrderByDateIncidentDesc(IncidentStatut statut, Pageable pageable);

    @Query("""
            SELECT i FROM Incident i
            WHERE (:statut IS NULL OR i.statut = :statut)
              AND (:type IS NULL OR i.typeIncident = :type)
              AND (:search IS NULL OR :search = ''
                   OR lower(i.badge.uidUnique) LIKE lower(concat('%', :search, '%'))
                   OR lower(concat(i.badge.employe.nom, ' ', i.badge.employe.prenom)) LIKE lower(concat('%', :search, '%'))
                   OR lower(concat(i.badge.employe.prenom, ' ', i.badge.employe.nom)) LIKE lower(concat('%', :search, '%')))
            ORDER BY i.dateIncident DESC
            """)
    Page<Incident> findByFilters(@Param("statut") IncidentStatut statut, @Param("type") TypeIncident type,
                                 @Param("search") String search, Pageable pageable);

    @Query("""
            SELECT i FROM Incident i
            WHERE i.badge.employe.direction.id = :directionId
              AND (:statut IS NULL OR i.statut = :statut)
              AND (:type IS NULL OR i.typeIncident = :type)
              AND (:search IS NULL OR :search = ''
                   OR lower(i.badge.uidUnique) LIKE lower(concat('%', :search, '%'))
                   OR lower(concat(i.badge.employe.nom, ' ', i.badge.employe.prenom)) LIKE lower(concat('%', :search, '%'))
                   OR lower(concat(i.badge.employe.prenom, ' ', i.badge.employe.nom)) LIKE lower(concat('%', :search, '%')))
            ORDER BY i.dateIncident DESC
            """)
    Page<Incident> findByDirectionIdAndFilters(@Param("directionId") Long directionId,
                                               @Param("statut") IncidentStatut statut, @Param("type") TypeIncident type,
                                               @Param("search") String search, Pageable pageable);

    long countByBadgeEmployeDirectionId(Long directionId);
    long countByBadgeEmployeDirectionIdAndStatut(Long directionId, IncidentStatut statut);
    long countByBadgeEmployeDirectionIdAndTypeIncident(Long directionId, TypeIncident typeIncident);
    List<Incident> findByBadgeId(Long badgeId);
    boolean existsByBadgeIdAndStatutIn(Long badgeId, List<IncidentStatut> statuts);
    long countByStatut(IncidentStatut statut);
    List<Incident> findByTypeIncidentAndStatutAndDateFinContratLessThanEqual(
            TypeIncident typeIncident, IncidentStatut statut, LocalDate date);
}
