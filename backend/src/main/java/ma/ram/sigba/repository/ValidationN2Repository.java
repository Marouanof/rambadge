package ma.ram.sigba.repository;

import ma.ram.sigba.entity.ValidationN2;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ValidationN2Repository extends JpaRepository<ValidationN2, Long> {
    Optional<ValidationN2> findByDemandeId(Long demandeId);
}
