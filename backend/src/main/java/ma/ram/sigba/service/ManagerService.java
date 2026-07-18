package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.ManagerRequestDTO;
import ma.ram.sigba.dto.ManagerResponseDTO;
import ma.ram.sigba.entity.Direction;
import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.entity.enums.UserStatut;
import ma.ram.sigba.exception.BusinessException;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.DirectionRepository;
import ma.ram.sigba.repository.UserRepository;
import org.springframework.data.domain.Page;
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
        } catch (Exception e) {
            log.warn("Création Keycloak échouée pour {} (user créé en BDD) : {}", request.getEmail(), e.getMessage());
        }

        try {
            keycloakService.envoyerEmailActivation(request.getEmail());
        } catch (Exception e) {
            log.warn("Envoi email d'activation échoué pour {} : {}", request.getEmail(), e.getMessage());
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
