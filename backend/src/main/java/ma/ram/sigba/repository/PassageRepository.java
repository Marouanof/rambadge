package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Passage;
import ma.ram.sigba.entity.enums.ResultatPassage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PassageRepository extends JpaRepository<Passage, Long> {
    Page<Passage> findByEmployeIdOrderByHorodatageDesc(Long employeId, Pageable pageable);
    Page<Passage> findByZoneIdOrderByHorodatageDesc(Long zoneId, Pageable pageable);
    Page<Passage> findByEmployeDirectionIdOrderByHorodatageDesc(Long directionId, Pageable pageable);
    Page<Passage> findByResultatOrderByHorodatageDesc(ResultatPassage resultat, Pageable pageable);
    Page<Passage> findByHorodatageBetweenOrderByHorodatageDesc(LocalDateTime start, LocalDateTime end, Pageable pageable);
    long countByEmployeIdAndResultat(Long employeId, ResultatPassage resultat);
    long countByZoneIdAndResultat(Long zoneId, ResultatPassage resultat);
    long countByDirectionId(Long directionId);
    long countByDirectionIdAndHorodatageBetween(Long directionId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT p FROM Passage p "
            + "LEFT JOIN p.direction dir WHERE "
            + "(CAST(:search AS string) IS NULL OR LOWER(p.employe.nom) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') "
            + "  OR LOWER(p.employe.prenom) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') "
            + "  OR LOWER(p.employe.email) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') "
            + "  OR LOWER(p.employe.matricule) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') "
            + "  OR LOWER(p.uidBadge) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%')) "
            + "AND (CAST(:zoneId AS long) IS NULL OR p.zone.id = :zoneId) "
            + "AND (CAST(:zone AS string) IS NULL OR LOWER(p.zone.nom) LIKE CONCAT('%', LOWER(CAST(:zone AS string)), '%')) "
            + "AND (CAST(:direction AS string) IS NULL OR LOWER(dir.nom) LIKE CONCAT('%', LOWER(CAST(:direction AS string)), '%')) "
            + "AND (CAST(:resultat AS string) IS NULL OR p.resultat = :resultat) "
            + "AND (CAST(:dateDebut AS timestamp) IS NULL OR p.horodatage >= :dateDebut) "
            + "AND (CAST(:dateFin AS timestamp) IS NULL OR p.horodatage <= :dateFin) "
            + "ORDER BY p.horodatage DESC")
    Page<Passage> search(@Param("search") String search,
                         @Param("zoneId") Long zoneId,
                         @Param("zone") String zone,
                         @Param("direction") String direction,
                         @Param("resultat") ResultatPassage resultat,
                         @Param("dateDebut") LocalDateTime dateDebut,
                         @Param("dateFin") LocalDateTime dateFin,
                         Pageable pageable);

    @Query("SELECT FUNCTION('date_trunc', 'day', p.horodatage), COUNT(p) FROM Passage p WHERE p.horodatage >= :since GROUP BY FUNCTION('date_trunc', 'day', p.horodatage) ORDER BY FUNCTION('date_trunc', 'day', p.horodatage)")
    List<Object[]> countParJourDepuis(@Param("since") LocalDateTime since);

    @Query("SELECT p.zone.nom, COUNT(p) FROM Passage p GROUP BY p.zone.nom ORDER BY COUNT(p) DESC")
    List<Object[]> countParZone();
}
