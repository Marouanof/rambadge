package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.ManagerRequestDTO;
import ma.ram.sigba.dto.ManagerResponseDTO;
import ma.ram.sigba.dto.UserResponseDTO;
import ma.ram.sigba.entity.*;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.entity.enums.UserStatut;
import ma.ram.sigba.entity.enums.ZoneDemandeeStatut;
import ma.ram.sigba.exception.BusinessException;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.*;
import org.springframework.data.domain.Page;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ManagerService {

    private final UserRepository userRepository;
    private final DirectionRepository directionRepository;
    private final JournalAdminService journalAdminService;
    private final KeycloakService keycloakService;
    private final EmailService emailService;
    private final BadgeRepository badgeRepository;
    private final ZoneDemandeeRepository zoneDemandeeRepository;

    public Page<ManagerResponseDTO> listerManagers(String search, String statut, Pageable pageable) {
        Page<User> managers;
        if (statut != null && !statut.isBlank()) {
            UserStatut userStatut = UserStatut.valueOf(statut.toUpperCase());
            managers = userRepository.searchByRoleAndStatut(UserRole.MANAGER, search != null ? search : "", userStatut, pageable);
        } else {
            managers = userRepository.searchByRole(UserRole.MANAGER, search != null ? search : "", pageable);
        }
        return managers.map(this::toResponseDTO);
    }

    public ManagerResponseDTO getManagerById(Long id) {
        User manager = findManagerById(id);
        return toResponseDTO(manager);
    }

    @Transactional
    public ManagerResponseDTO creerManager(ManagerRequestDTO request, User auteur) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("L'email '" + request.getEmail() + "' est déjà utilisé");
        }
        if (userRepository.existsByMatricule(request.getMatricule())) {
            throw new BusinessException("Le matricule '" + request.getMatricule() + "' est déjà utilisé");
        }

        Direction direction = directionRepository.findById(request.getDirectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Direction non trouvée avec l'id : " + request.getDirectionId()));

        if (direction.getManager() != null) {
            throw new BusinessException("La direction '" + direction.getNom() + "' a déjà un manager assigné");
        }

        User manager = User.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .matricule(request.getMatricule())
                .email(request.getEmail())
                .role(UserRole.MANAGER)
                .statut(UserStatut.ACTIF)
                .direction(direction)
                .build();

        manager = userRepository.save(manager);

        direction.setManager(manager);
        directionRepository.save(direction);

        try {
            keycloakService.creerUtilisateur(request.getEmail(), request.getNom(), request.getPrenom(), request.getMatricule(), "MANAGER");
            emailService.envoyerEmailActivationAgent(request.getEmail(), request.getPrenom(), request.getNom());
        } catch (Exception e) {
            log.warn("Création Keycloak échouée pour {} (user créé en BDD) : {}", request.getEmail(), e.getMessage());
        }

        journalAdminService.journaliser(auteur.getId(), "CREATION_MANAGER", "User", manager.getId(),
                "Création du manager : " + manager.getPrenom() + " " + manager.getNom() + " (" + manager.getEmail() + ") — Direction : " + direction.getNom());

        log.info("Manager créé : {} {} ({}) — Direction: {}", manager.getPrenom(), manager.getNom(), manager.getEmail(), direction.getNom());
        return toResponseDTO(manager);
    }

    @Transactional
    public ManagerResponseDTO modifierManager(Long id, ManagerRequestDTO request, User auteur) {
        User manager = findManagerById(id);

        if (userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new BusinessException("L'email '" + request.getEmail() + "' est déjà utilisé par un autre utilisateur");
        }
        if (userRepository.existsByMatriculeAndIdNot(request.getMatricule(), id)) {
            throw new BusinessException("Le matricule '" + request.getMatricule() + "' est déjà utilisé par un autre utilisateur");
        }

        Direction newDirection = directionRepository.findById(request.getDirectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Direction non trouvée avec l'id : " + request.getDirectionId()));

        if (newDirection.getManager() != null && !newDirection.getManager().getId().equals(id)) {
            throw new BusinessException("La direction '" + newDirection.getNom() + "' a déjà un manager assigné");
        }

        Direction oldDirection = manager.getDirection();

        manager.setNom(request.getNom());
        manager.setPrenom(request.getPrenom());
        manager.setMatricule(request.getMatricule());
        manager.setEmail(request.getEmail());
        manager.setDirection(newDirection);
        manager = userRepository.save(manager);

        if (oldDirection != null && !oldDirection.getId().equals(newDirection.getId())) {
            oldDirection.setManager(null);
            directionRepository.save(oldDirection);
        }
        newDirection.setManager(manager);
        directionRepository.save(newDirection);

        journalAdminService.journaliser(auteur.getId(), "MODIFICATION_MANAGER", "User", manager.getId(),
                "Modification du manager : " + manager.getPrenom() + " " + manager.getNom() + " (" + manager.getEmail() + ")");

        log.info("Manager modifié : {} {} ({})", manager.getPrenom(), manager.getNom(), manager.getEmail());
        return toResponseDTO(manager);
    }

    @Transactional
    public ManagerResponseDTO revoquerManager(Long id, User auteur) {
        User manager = findManagerById(id);

        if (UserStatut.INACTIF.equals(manager.getStatut())) {
            throw new BusinessException("Le manager est déjà révoqué");
        }

        manager.setStatut(UserStatut.INACTIF);

        Direction direction = manager.getDirection();
        if (direction != null) {
            direction.setManager(null);
            directionRepository.save(direction);
            manager.setDirection(null);
        }

        manager = userRepository.save(manager);

        journalAdminService.journaliser(auteur.getId(), "REVOCATION_MANAGER", "User", manager.getId(),
                "Révocation du manager : " + manager.getPrenom() + " " + manager.getNom() + " (" + manager.getEmail() + ")");

        log.info("Manager révoqué : {} {} ({})", manager.getPrenom(), manager.getNom(), manager.getEmail());
        return toResponseDTO(manager);
    }

    @Transactional
    public ManagerResponseDTO reactiverManager(Long id, User auteur) {
        User manager = findManagerById(id);

        if (UserStatut.ACTIF.equals(manager.getStatut())) {
            throw new BusinessException("Le manager est déjà actif");
        }

        manager.setStatut(UserStatut.ACTIF);
        manager = userRepository.save(manager);

        journalAdminService.journaliser(auteur.getId(), "REACTIVATION_MANAGER", "User", manager.getId(),
                "Réactivation du manager : " + manager.getPrenom() + " " + manager.getNom() + " (" + manager.getEmail() + ")");

        log.info("Manager réactivé : {} {} ({})", manager.getPrenom(), manager.getNom(), manager.getEmail());
        return toResponseDTO(manager);
    }

    public Page<UserResponseDTO> listerMesEmployes(User manager, boolean avecBadge, Pageable pageable) {
        if (manager.getDirection() == null) {
            throw new BusinessException("Aucune direction n'est assignée à ce manager");
        }
        Long directionId = manager.getDirection().getId();
        Page<User> employesPage = userRepository.findByDirectionIdAndRole(directionId, UserRole.EMPLOYE, pageable);

        if (avecBadge) {
            List<User> employesAvecBadge = employesPage.getContent().stream()
                    .filter(user -> badgeRepository.findByEmployeId(user.getId()).isPresent())
                    .toList();
            long total = employesAvecBadge.size();
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), employesAvecBadge.size());
            List<User> pageContent = start < end ? employesAvecBadge.subList(start, end) : List.of();
            org.springframework.data.domain.Page<User> filteredPage =
                    new org.springframework.data.domain.PageImpl<>(pageContent, pageable, total);
            return filteredPage.map(user -> buildUserResponseDTO(user));
        }

        return employesPage.map(user -> buildUserResponseDTO(user));
    }

    private UserResponseDTO buildUserResponseDTO(User user) {
            List<String> zonesHabilitees = List.of();
            java.time.LocalDateTime dateExpirationBadge = null;
            Long badgeId = null;

            var badgeOpt = badgeRepository.findByEmployeId(user.getId());
            if (badgeOpt.isPresent()) {
                Badge badge = badgeOpt.get();
                badgeId = badge.getId();
                dateExpirationBadge = badge.getDateExpiration();

                if (badge.getDemande() != null) {
                    List<ZoneDemandee> zoneDemandees = zoneDemandeeRepository.findByDemandeId(badge.getDemande().getId());
                    zonesHabilitees = zoneDemandees.stream()
                            .filter(zd -> ZoneDemandeeStatut.VALIDEE.equals(zd.getStatutN2()))
                            .map(zd -> zd.getZone().getNom())
                            .toList();
                }
            }

            return UserResponseDTO.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .nom(user.getNom())
                    .prenom(user.getPrenom())
                    .matricule(user.getMatricule())
                    .role(user.getRole().name())
                    .statut(user.getStatut().name())
                    .directionNom(user.getDirection() != null ? user.getDirection().getNom() : null)
                    .badgeId(badgeId)
                    .dateExpirationBadge(dateExpirationBadge)
                    .zonesHabilitees(zonesHabilitees)
                    .build();
    }

    private User findManagerById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Manager non trouvé avec l'id : " + id));
        if (!UserRole.MANAGER.equals(user.getRole())) {
            throw new ResourceNotFoundException("Manager non trouvé avec l'id : " + id);
        }
        return user;
    }

    private ManagerResponseDTO toResponseDTO(User manager) {
        Direction direction = manager.getDirection();
        return ManagerResponseDTO.builder()
                .id(manager.getId())
                .nom(manager.getNom())
                .prenom(manager.getPrenom())
                .matricule(manager.getMatricule())
                .email(manager.getEmail())
                .role(manager.getRole().name())
                .statut(manager.getStatut().name())
                .directionId(direction != null ? direction.getId() : null)
                .directionNom(direction != null ? direction.getNom() : null)
                .createdAt(manager.getCreatedAt())
                .updatedAt(manager.getUpdatedAt())
                .build();
    }
}
