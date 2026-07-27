package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Incident;
import ma.ram.sigba.entity.enums.IncidentStatut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    Page<Incident> findBySignalantId(Long signalantId, Pageable pageable);
    Page<Incident> findByBadgeEmployeDirectionId(Long directionId, Pageable pageable);
    Page<Incident> findByStatut(IncidentStatut statut, Pageable pageable);
    List<Incident> findByBadgeId(Long badgeId);
    long countByStatut(IncidentStatut statut);
}
