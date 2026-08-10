package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.PosteRequestDTO;
import ma.ram.sigba.dto.PosteResponseDTO;
import ma.ram.sigba.entity.Direction;
import ma.ram.sigba.entity.Poste;
import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.exception.BusinessException;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.PosteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PosteService {

    private final PosteRepository posteRepository;
    private final DirectionService directionService;

    @Transactional(readOnly = true)
    public List<PosteResponseDTO> listerPostesParDirection(Long directionId) {
        directionService.getDirectionById(directionId);
        return posteRepository.findByDirectionIdOrderByNomAsc(directionId).stream().map(this::toResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<PosteResponseDTO> listerPostesDirectionManager(User auteur) {
        Direction direction = verifierManager(auteur);
        return posteRepository.findByDirectionIdOrderByNomAsc(direction.getId()).stream().map(this::toResponseDTO).toList();
    }

    @Transactional
    public PosteResponseDTO creerPoste(PosteRequestDTO request, User auteur) {
        Direction direction = verifierManager(auteur);

        if (posteRepository.existsByDirectionIdAndNomIgnoreCase(direction.getId(), request.getNom().trim())) {
            throw new BusinessException("Le poste '" + request.getNom() + "' existe déjà dans votre direction");
        }

        Poste poste = Poste.builder()
                .nom(request.getNom().trim())
                .direction(direction)
                .build();
        poste = posteRepository.save(poste);

        log.info("Poste créé : {} (direction {})", poste.getNom(), direction.getNom());
        return toResponseDTO(poste);
    }

    @Transactional
    public void supprimerPoste(Long id, User auteur) {
        Direction direction = verifierManager(auteur);
        Poste poste = posteRepository.findByIdAndDirectionId(id, direction.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Poste non trouvé dans votre direction"));

        posteRepository.delete(poste);
        log.info("Poste supprimé : {} (direction {})", poste.getNom(), direction.getNom());
    }

    private Direction verifierManager(User auteur) {
        if (!UserRole.MANAGER.equals(auteur.getRole())) {
            throw new BusinessException("Seul un manager peut gérer les postes");
        }
        if (auteur.getDirection() == null) {
            throw new BusinessException("Vous n'avez pas de direction assignée");
        }
        if ("INACTIF".equals(auteur.getDirection().getStatut())) {
            throw new BusinessException("Votre direction est désactivée");
        }
        return auteur.getDirection();
    }

    private PosteResponseDTO toResponseDTO(Poste poste) {
        Direction direction = poste.getDirection();
        return PosteResponseDTO.builder()
                .id(poste.getId())
                .nom(poste.getNom())
                .directionId(direction != null ? direction.getId() : null)
                .directionNom(direction != null ? direction.getNom() : null)
                .build();
    }
}
