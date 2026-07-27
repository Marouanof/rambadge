package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Passage;
import ma.ram.sigba.entity.enums.ResultatPassage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface PassageRepository extends JpaRepository<Passage, Long> {
    Page<Passage> findByEmployeIdOrderByHorodatageDesc(Long employeId, Pageable pageable);
    Page<Passage> findByZoneIdOrderByHorodatageDesc(Long zoneId, Pageable pageable);
    Page<Passage> findByEmployeDirectionIdOrderByHorodatageDesc(Long directionId, Pageable pageable);
    Page<Passage> findByResultatOrderByHorodatageDesc(ResultatPassage resultat, Pageable pageable);
    Page<Passage> findByHorodatageBetweenOrderByHorodatageDesc(LocalDateTime start, LocalDateTime end, Pageable pageable);
    long countByEmployeIdAndResultat(Long employeId, ResultatPassage resultat);
    long countByZoneIdAndResultat(Long zoneId, ResultatPassage resultat);
}
