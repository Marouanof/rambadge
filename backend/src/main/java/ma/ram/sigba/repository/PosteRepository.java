package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Poste;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PosteRepository extends JpaRepository<Poste, Long> {

    List<Poste> findByDirectionIdOrderByNomAsc(Long directionId);

    Optional<Poste> findByIdAndDirectionId(Long id, Long directionId);

    boolean existsByDirectionIdAndNomIgnoreCase(Long directionId, String nom);
}
