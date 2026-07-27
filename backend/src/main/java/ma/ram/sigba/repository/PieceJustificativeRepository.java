package ma.ram.sigba.repository;

import ma.ram.sigba.entity.PieceJustificative;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PieceJustificativeRepository extends JpaRepository<PieceJustificative, Long> {
    List<PieceJustificative> findByDemandeId(Long demandeId);
}
