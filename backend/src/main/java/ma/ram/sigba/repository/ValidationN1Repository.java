package ma.ram.sigba.repository;

import ma.ram.sigba.entity.ValidationN1;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ValidationN1Repository extends JpaRepository<ValidationN1, Long> {
    Optional<ValidationN1> findByDemandeId(Long demandeId);
}
