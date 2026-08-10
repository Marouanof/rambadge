package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Direction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DirectionRepository extends JpaRepository<Direction, Long> {

    Optional<Direction> findByCodeDirection(String codeDirection);

    boolean existsByCodeDirection(String codeDirection);

    boolean existsByCodeDirectionAndIdNot(String codeDirection, Long id);

    @Query("SELECT d FROM Direction d WHERE " +
           "(COALESCE(:search, '') = '' OR LOWER(d.nom) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(d.codeDirection) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (COALESCE(:statut, '') = '' OR d.statut = :statut) " +
           "AND (:managerId IS NULL OR d.manager.id = :managerId)")
    Page<Direction> search(@Param("search") String search, @Param("statut") String statut,
                           @Param("managerId") Long managerId, Pageable pageable);

    @Query("SELECT d FROM Direction d WHERE d.manager IS NULL " +
           "AND (COALESCE(:search, '') = '' OR LOWER(d.nom) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(d.codeDirection) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Direction> findDisponibles(@Param("search") String search, Pageable pageable);
}
