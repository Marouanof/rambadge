package ma.ram.sigba.repository;

import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.entity.enums.UserStatut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByMatricule(String matricule);
    boolean existsByMatriculeAndIdNot(String matricule, Long id);
    long countByDirectionId(Long directionId);
    long countByDirectionIdAndStatut(Long directionId, UserStatut statut);
    long countByRole(UserRole role);
    Page<User> findByDirectionId(Long directionId, Pageable pageable);
    Page<User> findByDirectionIdAndRole(Long directionId, UserRole role, Pageable pageable);

    Page<User> findByRole(UserRole role, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = :role AND (" +
           "LOWER(u.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.prenom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.matricule) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchByRole(@Param("role") UserRole role, @Param("search") String search, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = :role AND u.statut = :statut AND (" +
           "LOWER(u.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.prenom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.matricule) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchByRoleAndStatut(@Param("role") UserRole role, @Param("search") String search, @Param("statut") UserStatut statut, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = 'EMPLOYE' AND (" +
           "LOWER(u.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.prenom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.matricule) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchEmployes(@Param("search") String search, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = 'EMPLOYE' AND u.statut = :statut AND (" +
           "LOWER(u.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.prenom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.matricule) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchEmployesByStatut(@Param("search") String search, @Param("statut") UserStatut statut, Pageable pageable);
}
