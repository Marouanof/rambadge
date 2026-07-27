package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Demande;
import ma.ram.sigba.entity.enums.DemandeStatut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DemandeRepository extends JpaRepository<Demande, Long> {

    Page<Demande> findByEmployeIdOrderByCreatedAtDesc(Long employeId, Pageable pageable);

    @Query("SELECT d FROM Demande d WHERE d.employe.direction.id = :directionId AND d.statut = :statut ORDER BY d.createdAt DESC")
    Page<Demande> findByDirectionIdAndStatut(@Param("directionId") Long directionId, @Param("statut") DemandeStatut statut, Pageable pageable);

    @Query("SELECT d FROM Demande d WHERE d.employe.direction.id = :directionId ORDER BY d.createdAt DESC")
    Page<Demande> findByDirectionId(@Param("directionId") Long directionId, Pageable pageable);

    Page<Demande> findByStatutOrderByCreatedAtDesc(DemandeStatut statut, Pageable pageable);

    long countByEmployeIdAndStatut(Long employeId, DemandeStatut statut);

    long countByEmployeDirectionIdAndStatut(Long directionId, DemandeStatut statut);

    Page<Demande> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
