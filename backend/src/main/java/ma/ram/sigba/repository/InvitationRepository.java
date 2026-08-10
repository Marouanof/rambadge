package ma.ram.sigba.repository;

import ma.ram.sigba.entity.Invitation;
import ma.ram.sigba.entity.enums.InvitationStatut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {

    Optional<Invitation> findByCodeUnique(String codeUnique);

    boolean existsByCodeUnique(String codeUnique);

    boolean existsByEmailDestinataireAndStatut(String emailDestinataire, InvitationStatut statut);

    List<Invitation> findByStatutAndDateExpirationBefore(InvitationStatut statut, LocalDateTime date);

    @Query("SELECT i FROM Invitation i WHERE i.emetteur.id = :emetteurId AND " +
           "(COALESCE(:search, '') = '' OR LOWER(i.emailDestinataire) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(i.codeUnique) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:statut IS NULL OR i.statut = :statut)")
    Page<Invitation> searchByEmetteur(@Param("emetteurId") Long emetteurId,
                                       @Param("search") String search,
                                       @Param("statut") InvitationStatut statut,
                                       Pageable pageable);
}
