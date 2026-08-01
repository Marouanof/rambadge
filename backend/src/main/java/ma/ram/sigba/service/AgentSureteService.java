package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.AgentSureteRequestDTO;
import ma.ram.sigba.dto.AgentSureteResponseDTO;
import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.entity.enums.UserStatut;
import ma.ram.sigba.exception.BusinessException;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentSureteService {

    private final UserRepository userRepository;
    private final JournalAdminService journalAdminService;
    private final KeycloakService keycloakService;
    private final EmailService emailService;

    public Page<AgentSureteResponseDTO> listerAgents(String search, String statut, Pageable pageable) {
        Page<User> agents;
        if (statut != null && !statut.isBlank()) {
            UserStatut userStatut = UserStatut.valueOf(statut.toUpperCase());
            agents = userRepository.searchByRoleAndStatut(UserRole.AGENT_SURETE, search != null ? search : "", userStatut, pageable);
        } else {
            agents = userRepository.searchByRole(UserRole.AGENT_SURETE, search != null ? search : "", pageable);
        }
        return agents.map(this::toResponseDTO);
    }

    public AgentSureteResponseDTO getAgentById(Long id) {
        User agent = findAgentById(id);
        return toResponseDTO(agent);
    }

    @Transactional
    public AgentSureteResponseDTO creerAgent(AgentSureteRequestDTO request, User auteur) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("L'email '" + request.getEmail() + "' est déjà utilisé");
        }
        if (userRepository.existsByMatricule(request.getMatricule())) {
            throw new BusinessException("Le matricule '" + request.getMatricule() + "' est déjà utilisé");
        }

        String poste = request.getPoste() != null && !request.getPoste().isBlank()
                ? request.getPoste()
                : "Agent de sûreté aéroportuaire";

        User agent = User.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .matricule(request.getMatricule())
                .poste(poste)
                .email(request.getEmail())
                .role(UserRole.AGENT_SURETE)
                .statut(UserStatut.ACTIF)
                .build();

        agent = userRepository.save(agent);

        try {
            keycloakService.creerUtilisateur(request.getEmail(), request.getNom(), request.getPrenom(), request.getMatricule(), "AGENT_SURETE");
            emailService.envoyerEmailActivationAgent(request.getEmail(), request.getPrenom(), request.getNom());
        } catch (Exception e) {
            log.warn("Création Keycloak échouée pour {} (user créé en BDD) : {}", request.getEmail(), e.getMessage());
        }

        journalAdminService.journaliser(auteur.getId(), "CREATION_AGENT_SURETE", "User", agent.getId(),
                "Création de l'agent de sûreté : " + agent.getPrenom() + " " + agent.getNom() + " (" + agent.getEmail() + ")");

        log.info("Agent de sûreté créé : {} {} ({})", agent.getPrenom(), agent.getNom(), agent.getEmail());
        return toResponseDTO(agent);
    }

    @Transactional
    public AgentSureteResponseDTO modifierAgent(Long id, AgentSureteRequestDTO request, User auteur) {
        User agent = findAgentById(id);

        if (userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new BusinessException("L'email '" + request.getEmail() + "' est déjà utilisé par un autre utilisateur");
        }
        if (userRepository.existsByMatriculeAndIdNot(request.getMatricule(), id)) {
            throw new BusinessException("Le matricule '" + request.getMatricule() + "' est déjà utilisé par un autre utilisateur");
        }

        agent.setNom(request.getNom());
        agent.setPrenom(request.getPrenom());
        agent.setMatricule(request.getMatricule());
        agent.setEmail(request.getEmail());
        agent = userRepository.save(agent);

        journalAdminService.journaliser(auteur.getId(), "MODIFICATION_AGENT_SURETE", "User", agent.getId(),
                "Modification de l'agent de sûreté : " + agent.getPrenom() + " " + agent.getNom() + " (" + agent.getEmail() + ")");

        log.info("Agent de sûreté modifié : {} {} ({})", agent.getPrenom(), agent.getNom(), agent.getEmail());
        return toResponseDTO(agent);
    }

    @Transactional
    public AgentSureteResponseDTO revoquerAgent(Long id, User auteur) {
        User agent = findAgentById(id);

        if (UserStatut.INACTIF.equals(agent.getStatut())) {
            throw new BusinessException("L'agent de sûreté est déjà révoqué");
        }

        agent.setStatut(UserStatut.INACTIF);
        agent = userRepository.save(agent);

        journalAdminService.journaliser(auteur.getId(), "REVOCATION_AGENT_SURETE", "User", agent.getId(),
                "Révocation de l'agent de sûreté : " + agent.getPrenom() + " " + agent.getNom() + " (" + agent.getEmail() + ")");

        log.info("Agent de sûreté révoqué : {} {} ({})", agent.getPrenom(), agent.getNom(), agent.getEmail());
        return toResponseDTO(agent);
    }

    @Transactional
    public AgentSureteResponseDTO reactiverAgent(Long id, User auteur) {
        User agent = findAgentById(id);

        if (UserStatut.ACTIF.equals(agent.getStatut())) {
            throw new BusinessException("L'agent de sûreté est déjà actif");
        }

        agent.setStatut(UserStatut.ACTIF);
        agent = userRepository.save(agent);

        journalAdminService.journaliser(auteur.getId(), "REACTIVATION_AGENT_SURETE", "User", agent.getId(),
                "Réactivation de l'agent de sûreté : " + agent.getPrenom() + " " + agent.getNom() + " (" + agent.getEmail() + ")");

        log.info("Agent de sûreté réactivé : {} {} ({})", agent.getPrenom(), agent.getNom(), agent.getEmail());
        return toResponseDTO(agent);
    }

    private User findAgentById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agent de sûreté non trouvé avec l'id : " + id));
        if (!UserRole.AGENT_SURETE.equals(user.getRole())) {
            throw new ResourceNotFoundException("Agent de sûreté non trouvé avec l'id : " + id);
        }
        return user;
    }

    private AgentSureteResponseDTO toResponseDTO(User agent) {
        return AgentSureteResponseDTO.builder()
                .id(agent.getId())
                .nom(agent.getNom())
                .prenom(agent.getPrenom())
                .matricule(agent.getMatricule())
                .poste(agent.getPoste())
                .email(agent.getEmail())
                .role(agent.getRole().name())
                .statut(agent.getStatut().name())
                .createdAt(agent.getCreatedAt())
                .updatedAt(agent.getUpdatedAt())
                .build();
    }
}
