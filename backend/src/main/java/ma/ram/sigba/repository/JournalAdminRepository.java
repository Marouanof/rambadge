package ma.ram.sigba.repository;

import ma.ram.sigba.entity.JournalAdmin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JournalAdminRepository extends JpaRepository<JournalAdmin, Long> {
    List<JournalAdmin> findByAuteurIdOrderByCreatedAtDesc(Long auteurId);
    List<JournalAdmin> findByCibleTypeAndCibleId(String cibleType, Long cibleId);
}
