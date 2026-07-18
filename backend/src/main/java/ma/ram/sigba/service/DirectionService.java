package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.DirectionRequestDTO;
import ma.ram.sigba.dto.DirectionResponseDTO;
import ma.ram.sigba.dto.UserResponseDTO;
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
public class DirectionService {

    private final DirectionRepository directionRepository;
    private final UserRepository userRepository;
    private final JournalAdminService journalAdminService;

    public Page<DirectionResponseDTO> listerDirections(String search, String statut, Pageable pageable) {
        return directionRepository.search(search, statut, pageable).map(this::toResponseDTO);
    }

    public DirectionResponseDTO getDirectionById(Long id) {
        Direction direction = directionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Direction non trouvée avec l'id : " + id));
        return toResponseDTO(direction);
    }

    @Transactional
    public DirectionResponseDTO creerDirection(DirectionRequestDTO request, User auteur) {
        if (directionRepository.existsByCodeDirection(request.getCodeDirection())) {
            throw new BusinessException("Le code direction '" + request.getCodeDirection() + "' existe déjà");
        }

        Direction direction = Direction.builder()
                .nom(request.getNom())
                .codeDirection(request.getCodeDirection())
                .statut("ACTIF")
                .build();

        direction = directionRepository.save(direction);
        journalAdminService.journaliser(auteur.getId(), "CREATION_DIRECTION", "Direction", direction.getId(),
                "Création de la direction : " + direction.getNom() + " (" + direction.getCodeDirection() + ")");

        log.info("Direction créée : {} ({})", direction.getNom(), direction.getCodeDirection());
        return toResponseDTO(direction);
    }

    @Transactional
    public DirectionResponseDTO modifierDirection(Long id, DirectionRequestDTO request, User auteur) {
        Direction direction = directionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Direction non trouvée avec l'id : " + id));

        if (directionRepository.existsByCodeDirectionAndIdNot(request.getCodeDirection(), id)) {
            throw new BusinessException("Le code direction '" + request.getCodeDirection() + "' est déjà utilisé par une autre direction");
        }

        direction.setNom(request.getNom());
        direction.setCodeDirection(request.getCodeDirection());
        direction = directionRepository.save(direction);

        journalAdminService.journaliser(auteur.getId(), "MODIFICATION_DIRECTION", "Direction", direction.getId(),
                "Modification de la direction : " + direction.getNom() + " (" + direction.getCodeDirection() + ")");

        log.info("Direction modifiée : {} ({})", direction.getNom(), direction.getCodeDirection());
        return toResponseDTO(direction);
    }

    @Transactional
    public DirectionResponseDTO desactiverDirection(Long id, User auteur) {
        Direction direction = directionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Direction non trouvée avec l'id : " + id));

        if ("DESACTIVE".equals(direction.getStatut())) {
            throw new BusinessException("La direction est déjà désactivée");
        }

        direction.setStatut("DESACTIVE");
        direction = directionRepository.save(direction);

        long employesActifs = userRepository.countByDirectionIdAndStatut(id, UserStatut.ACTIF);
        journalAdminService.journaliser(auteur.getId(), "DESACTIVATION_DIRECTION", "Direction", direction.getId(),
                "Désactivation de la direction : " + direction.getNom() + " — " + employesActifs + " employé(s) actif(s) affecté(s)");

        log.info("Direction désactivée : {} ({})", direction.getNom(), direction.getCodeDirection());
        return toResponseDTO(direction);
    }

    @Transactional
    public DirectionResponseDTO activerDirection(Long id, User auteur) {
        Direction direction = directionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Direction non trouvée avec l'id : " + id));

        if ("ACTIF".equals(direction.getStatut())) {
            throw new BusinessException("La direction est déjà active");
        }

        direction.setStatut("ACTIF");
        direction = directionRepository.save(direction);

        journalAdminService.journaliser(auteur.getId(), "ACTIVATION_DIRECTION", "Direction", direction.getId(),
                "Activation de la direction : " + direction.getNom() + " (" + direction.getCodeDirection() + ")");

        log.info("Direction activée : {} ({})", direction.getNom(), direction.getCodeDirection());
        return toResponseDTO(direction);
    }

    public Page<UserResponseDTO> listerEmployesParDirection(Long directionId, Pageable pageable) {
        if (!directionRepository.existsById(directionId)) {
            throw new ResourceNotFoundException("Direction non trouvée avec l'id : " + directionId);
        }

        return userRepository.findByDirectionId(directionId, pageable).map(user -> UserResponseDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .matricule(user.getMatricule())
                .role(user.getRole().name())
                .statut(user.getStatut().name())
                .directionNom(user.getDirection() != null ? user.getDirection().getNom() : null)
                .build());
    }

    private DirectionResponseDTO toResponseDTO(Direction direction) {
        User manager = direction.getManager();
        long nombreEmployes = userRepository.countByDirectionId(direction.getId());

        return DirectionResponseDTO.builder()
                .id(direction.getId())
                .nom(direction.getNom())
                .codeDirection(direction.getCodeDirection())
                .managerNom(manager != null ? manager.getPrenom() + " " + manager.getNom() : null)
                .managerEmail(manager != null ? manager.getEmail() : null)
                .nombreEmployes((int) nombreEmployes)
                .statut(direction.getStatut())
                .createdAt(direction.getCreatedAt())
                .updatedAt(direction.getUpdatedAt())
                .build();
    }
}
