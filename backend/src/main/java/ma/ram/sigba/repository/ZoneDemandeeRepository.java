package ma.ram.sigba.repository;

import ma.ram.sigba.entity.ZoneDemandee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ZoneDemandeeRepository extends JpaRepository<ZoneDemandee, Long> {
    List<ZoneDemandee> findByDemandeId(Long demandeId);
}
