package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Demande;
import ma.ram.sigba.entity.enums.DemandeStatut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface DemandeRepository extends JpaRepository<Demande, Long> {

    Page<Demande> findByEmployeIdOrderByCreatedAtDesc(Long employeId, Pageable pageable);

    @Query("SELECT d FROM Demande d WHERE d.employe.direction.id = :directionId AND d.statut = :statut ORDER BY d.createdAt ASC")
    Page<Demande> findByDirectionIdAndStatutOrderByCreatedAtAsc(@Param("directionId") Long directionId, @Param("statut") DemandeStatut statut, Pageable pageable);

    @Query("SELECT d FROM Demande d WHERE d.employe.direction.id = :directionId ORDER BY d.createdAt DESC")
    Page<Demande> findByDirectionId(@Param("directionId") Long directionId, Pageable pageable);

    Page<Demande> findByStatutOrderByCreatedAtDesc(DemandeStatut statut, Pageable pageable);

    @Query("SELECT d FROM Demande d WHERE d.statut = :statut ORDER BY d.createdAt ASC")
    Page<Demande> findByStatutOrderByCreatedAtAsc(@Param("statut") DemandeStatut statut, Pageable pageable);

    long countByEmployeIdAndStatut(Long employeId, DemandeStatut statut);

    long countByEmployeDirectionIdAndStatut(Long directionId, DemandeStatut statut);

    Page<Demande> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT d FROM Demande d "
            + "LEFT JOIN d.employe e "
            + "LEFT JOIN e.direction dir WHERE "
            + "(CAST(:search AS string) IS NULL OR LOWER(e.nom) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') "
            + "  OR LOWER(e.prenom) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') "
            + "  OR LOWER(e.email) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') "
            + "  OR LOWER(e.matricule) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%')) "
            + "AND (CAST(:direction AS string) IS NULL OR LOWER(dir.nom) LIKE CONCAT('%', LOWER(CAST(:direction AS string)), '%')) "
            + "AND (CAST(:statut AS string) IS NULL OR d.statut = :statut) "
            + "AND (CAST(:dateDebut AS timestamp) IS NULL OR d.createdAt >= :dateDebut) "
            + "AND (CAST(:dateFin AS timestamp) IS NULL OR d.createdAt <= :dateFin) "
            + "ORDER BY d.createdAt DESC")
    Page<Demande> search(@Param("search") String search,
                         @Param("direction") String direction,
                         @Param("statut") DemandeStatut statut,
                         @Param("dateDebut") LocalDateTime dateDebut,
                         @Param("dateFin") LocalDateTime dateFin,
                         Pageable pageable);

    @Query("SELECT FUNCTION('date_trunc', 'day', d.createdAt), COUNT(d) FROM Demande d WHERE d.createdAt >= :since GROUP BY FUNCTION('date_trunc', 'day', d.createdAt) ORDER BY FUNCTION('date_trunc', 'day', d.createdAt)")
    List<Object[]> countParJourDepuis(@Param("since") LocalDateTime since);

    @Query("SELECT d FROM Demande d WHERE d.statut IN :statuts ORDER BY d.createdAt ASC")
    List<Demande> findPlusAnciennesParStatuts(@Param("statuts") List<DemandeStatut> statuts, Pageable pageable);
}
