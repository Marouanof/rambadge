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
import ma.ram.sigba.entity.enums.DemandeStatut;
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
    private final KeycloakService keycloakService;
    private final EmailService emailService;
    private final BadgeRepository badgeRepository;
    private final ZoneDemandeeRepository zoneDemandeeRepository;
    private final DemandeRepository demandeRepository;
    private final BadgeService badgeService;

    public Page<ManagerResponseDTO> listerManagers(String search, String statut, Pageable pageable) {
        Page<User> managers;
        if (statut != null && !statut.isBlank()) {
            UserStatut userStatut = UserStatut.parse(statut);
            if (userStatut != null) {
                managers = userRepository.searchByRoleAndStatut(UserRole.MANAGER, search != null ? search : "", userStatut, pageable);
            } else {
                managers = userRepository.searchByRole(UserRole.MANAGER, search != null ? search : "", pageable);
            }
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

        if ("INACTIF".equals(direction.getStatut())) {
            throw new BusinessException("Impossible d'assigner un manager à une direction désactivée");
        }

        if (direction.getManager() != null) {
            throw new BusinessException("La direction '" + direction.getNom() + "' a déjà un manager assigné");
        }

        User manager = User.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .matricule(request.getMatricule())
                .poste(request.getPoste())
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

        if ("INACTIF".equals(newDirection.getStatut())) {
            throw new BusinessException("Impossible d'assigner un manager à la direction désactivée '" + newDirection.getNom() + "'");
        }

        if (newDirection.getManager() != null && !newDirection.getManager().getId().equals(id)) {
            throw new BusinessException("La direction '" + newDirection.getNom() + "' a déjà un manager assigné");
        }

        Direction oldDirection = manager.getDirection();

        if (oldDirection != null && !oldDirection.getId().equals(newDirection.getId())) {
            long demandesEnAttente = demandeRepository.countByEmployeDirectionIdAndStatut(oldDirection.getId(), DemandeStatut.EN_ATTENTE_N1);
            if (demandesEnAttente > 0) {
                throw new BusinessException("Transfert impossible : la direction '" + oldDirection.getNom()
                        + "' a encore " + demandesEnAttente + " demande(s) en attente de validation N1. Traitez ces demandes avant de changer la direction du manager.");
            }
        }

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

        try {
            keycloakService.desactiverUtilisateur(manager.getEmail());
        } catch (Exception e) {
            log.warn("Désactivation Keycloak échouée pour {} : {}", manager.getEmail(), e.getMessage());
        }

        log.info("Manager révoqué : {} {} ({})", manager.getPrenom(), manager.getNom(), manager.getEmail());
        return toResponseDTO(manager);
    }

    @Transactional
    public ManagerResponseDTO reactiverManager(Long id, User auteur) {
        User manager = findManagerById(id);

        if (UserStatut.ACTIF.equals(manager.getStatut())) {
            throw new BusinessException("Le manager est déjà actif");
        }

        if (manager.getDirection() == null) {
            throw new BusinessException("Impossible de réactiver ce manager : aucune direction n'est assignée. Réassignez une direction avant de le réactiver.");
        }

        if ("INACTIF".equals(manager.getDirection().getStatut())) {
            throw new BusinessException("Impossible de réactiver ce manager : la direction '" + manager.getDirection().getNom()
                    + "' est désactivée. Réactivez la direction avant de réactiver le manager.");
        }

        manager.setStatut(UserStatut.ACTIF);
        manager = userRepository.save(manager);

        try {
            keycloakService.activerUtilisateur(manager.getEmail());
        } catch (Exception e) {
            log.warn("Réactivation Keycloak échouée pour {} : {}", manager.getEmail(), e.getMessage());
        }

        log.info("Manager réactivé : {} {} ({})", manager.getPrenom(), manager.getNom(), manager.getEmail());
        return toResponseDTO(manager);
    }

    public Page<UserResponseDTO> listerMesEmployes(User manager, boolean avecBadge, String search, String statut, String poste, Pageable pageable) {
        if (manager.getStatut() != UserStatut.ACTIF) {
            throw new BusinessException("Votre compte est désactivé");
        }
        if (manager.getDirection() == null) {
            throw new BusinessException("Aucune direction n'est assignée à ce manager");
        }
        Long directionId = manager.getDirection().getId();
        UserStatut userStatut = UserStatut.parse(statut);
        String posteFiltre = (poste != null && !poste.isBlank()) ? poste : null;
        Page<User> employesPage = userRepository.searchByDirectionAndRole(
                directionId, UserRole.EMPLOYE, search != null ? search : "", userStatut, posteFiltre, avecBadge, pageable);

        return employesPage.map(user -> buildUserResponseDTO(user));
    }

    public List<String> listerPostesMesEmployes(User manager) {
        if (manager.getStatut() != UserStatut.ACTIF) {
            throw new BusinessException("Votre compte est désactivé");
        }
        if (manager.getDirection() == null) {
            throw new BusinessException("Aucune direction n'est assignée à ce manager");
        }
        return userRepository.findDistinctPostesByDirectionIdAndRole(manager.getDirection().getId(), UserRole.EMPLOYE);
    }

    @Transactional
    public UserResponseDTO changerStatutEmploye(User manager, Long employeId, UserStatut nouveauStatut) {
        if (manager.getStatut() != UserStatut.ACTIF) {
            throw new BusinessException("Votre compte est désactivé");
        }
        if (manager.getDirection() == null) {
            throw new BusinessException("Aucune direction n'est assignée à ce manager");
        }
        User employe = userRepository.findById(employeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employé non trouvé avec l'id : " + employeId));
        if (!UserRole.EMPLOYE.equals(employe.getRole())) {
            throw new ResourceNotFoundException("Employé non trouvé avec l'id : " + employeId);
        }
        if (employe.getDirection() == null || !manager.getDirection().getId().equals(employe.getDirection().getId())) {
            throw new BusinessException("Cet employé ne fait pas partie de votre direction");
        }
        if (employe.getStatut() == nouveauStatut) {
            throw new BusinessException("Le statut de l'employé est déjà : " + nouveauStatut);
        }

        UserStatut ancienStatut = employe.getStatut();

        if (nouveauStatut == UserStatut.INACTIF) {
            badgeRepository.findByEmployeId(employeId).ifPresent(badge -> badgeService.revoquerBadge(badge.getId()));
            try {
                keycloakService.desactiverUtilisateur(employe.getEmail());
            } catch (Exception e) {
                log.warn("Désactivation Keycloak échouée pour {} : {}", employe.getEmail(), e.getMessage());
            }
        } else if (nouveauStatut == UserStatut.ACTIF && ancienStatut == UserStatut.INACTIF) {
            try {
                keycloakService.activerUtilisateur(employe.getEmail());
            } catch (Exception e) {
                log.warn("Réactivation Keycloak échouée pour {} : {}", employe.getEmail(), e.getMessage());
            }
        }

        employe.setStatut(nouveauStatut);
        employe = userRepository.save(employe);

        log.info("Statut employé {} changé en {} par {}", employeId, nouveauStatut, manager.getEmail());
        return buildUserResponseDTO(employe);
    }

    private UserResponseDTO buildUserResponseDTO(User user) {
            List<String> zonesHabilitees = List.of();
            java.time.LocalDateTime dateExpirationBadge = null;
            Long badgeId = null;
            String badgeUid = null;

            var badgeOpt = badgeRepository.findByEmployeId(user.getId());
            if (badgeOpt.isPresent()) {
                Badge badge = badgeOpt.get();
                badgeId = badge.getId();
                badgeUid = badge.getUidUnique();
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
                    .poste(user.getPoste())
                    .role(user.getRole().name())
                    .statut(user.getStatut().name())
                    .directionNom(user.getDirection() != null ? user.getDirection().getNom() : null)
                    .badgeId(badgeId)
                    .badgeUid(badgeUid)
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
                .poste(manager.getPoste())
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
