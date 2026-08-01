package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.IncidentResponseDTO;
import ma.ram.sigba.dto.SignalerIncidentRequestDTO;
import ma.ram.sigba.entity.Badge;
import ma.ram.sigba.entity.Incident;
import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.enums.BadgeStatut;
import ma.ram.sigba.entity.enums.IncidentStatut;
import ma.ram.sigba.entity.enums.TypeIncident;
import ma.ram.sigba.entity.enums.TypeNotification;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.entity.enums.UserStatut;
import ma.ram.sigba.exception.BusinessException;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.BadgeRepository;
import ma.ram.sigba.repository.IncidentRepository;
import ma.ram.sigba.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final BadgeRepository badgeRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Transactional
    public IncidentResponseDTO signalerIncident(SignalerIncidentRequestDTO request, User signalant) {
        Badge badge = badgeRepository.findById(request.getBadgeId())
                .orElseThrow(() -> new ResourceNotFoundException("Badge non trouvé avec l'id : " + request.getBadgeId()));

        if (badge.getStatut() == BadgeStatut.REVOQUE || badge.getStatut() == BadgeStatut.EXPIRE) {
            throw new BusinessException("Le badge est déjà " + badge.getStatut().name().toLowerCase() + ", impossible de signaler un incident");
        }

        TypeIncident type = TypeIncident.valueOf(request.getTypeIncident().toUpperCase());
        if (type == TypeIncident.FIN_CONTRAT && signalant.getRole() != UserRole.MANAGER && signalant.getRole() != UserRole.SUPER_ADMIN) {
            throw new BusinessException("Seul un MANAGER ou SUPER_ADMIN peut signaler un fin de contrat");
        }

        badge.setStatut(BadgeStatut.SUSPENDU);
        badge.setDateSuspension(LocalDateTime.now());
        badgeRepository.save(badge);

        Incident incident = Incident.builder()
                .badge(badge)
                .signalant(signalant)
                .typeIncident(type)
                .dateIncident(LocalDateTime.now())
                .commentaire(request.getCommentaire())
                .statut(IncidentStatut.SUSPENDU)
                .build();
        incident = incidentRepository.save(incident);

        List<User> agentsSurete = userRepository.findByRoleAndStatut(UserRole.AGENT_SURETE, UserStatut.ACTIF);
        for (User agent : agentsSurete) {
            notificationService.creerNotification(agent, TypeNotification.INCIDENT_SIGNAL,
                    "Incident " + type.name() + " signalé sur le badge " + badge.getUidUnique() + " (" + badge.getEmploye().getPrenom() + " " + badge.getEmploye().getNom() + ")",
                    "/incidents-surete");
        }

        log.info("Incident signalé : type={}, badge={}, signalant={}", type, badge.getUidUnique(), signalant.getEmail());
        return toResponseDTO(incident);
    }

    public Page<IncidentResponseDTO> listerIncidents(User currentUser, Pageable pageable) {
        Page<Incident> incidents;
        if (currentUser.getRole() == UserRole.SUPER_ADMIN) {
            incidents = incidentRepository.findAll(pageable);
        } else if (currentUser.getRole() == UserRole.MANAGER) {
            incidents = incidentRepository.findByBadgeEmployeDirectionId(currentUser.getDirection().getId(), pageable);
        } else if (currentUser.getRole() == UserRole.AGENT_SURETE) {
            incidents = incidentRepository.findByStatut(IncidentStatut.SUSPENDU, pageable);
        } else {
            incidents = incidentRepository.findBySignalantId(currentUser.getId(), pageable);
        }
        return incidents.map(this::toResponseDTO);
    }

    public IncidentResponseDTO getIncidentById(Long id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident non trouvé avec l'id : " + id));
        return toResponseDTO(incident);
    }

    @Transactional
    public IncidentResponseDTO confirmerRevocation(Long id, User agent) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident non trouvé avec l'id : " + id));

        if (incident.getStatut() != IncidentStatut.SUSPENDU) {
            throw new BusinessException("Seul un incident SUSPENDU peut être traité (statut actuel : " + incident.getStatut() + ")");
        }

        Badge badge = incident.getBadge();
        badge.setStatut(BadgeStatut.REVOQUE);
        badge.setDateRevocation(LocalDateTime.now());
        badgeRepository.save(badge);

        incident.setStatut(IncidentStatut.REVOQUE);
        incident.setDateTraitement(LocalDateTime.now());
        incident.setAgent(agent);
        incidentRepository.save(incident);

        log.info("Incident {} confirmé → badge révoqué par {}", id, agent.getEmail());
        return toResponseDTO(incident);
    }

    @Transactional
    public IncidentResponseDTO leverSuspension(Long id, User agent) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident non trouvé avec l'id : " + id));

        if (incident.getStatut() != IncidentStatut.SUSPENDU) {
            throw new BusinessException("Seul un incident SUSPENDU peut être levé (statut actuel : " + incident.getStatut() + ")");
        }

        Badge badge = incident.getBadge();
        badge.setStatut(BadgeStatut.ACTIF);
        badge.setDateSuspension(null);
        badgeRepository.save(badge);

        incident.setStatut(IncidentStatut.LEVE);
        incident.setDateTraitement(LocalDateTime.now());
        incident.setAgent(agent);
        incidentRepository.save(incident);

        log.info("Incident {} levé → badge réactivé par {}", id, agent.getEmail());
        return toResponseDTO(incident);
    }

    private IncidentResponseDTO toResponseDTO(Incident incident) {
        return IncidentResponseDTO.builder()
                .id(incident.getId())
                .badgeId(incident.getBadge().getId())
                .badgeUid(incident.getBadge().getUidUnique())
                .signalantId(incident.getSignalant().getId())
                .signalantNom(incident.getSignalant().getNom() + " " + incident.getSignalant().getPrenom())
                .typeIncident(incident.getTypeIncident().name())
                .dateIncident(incident.getDateIncident())
                .commentaire(incident.getCommentaire())
                .statut(incident.getStatut().name())
                .dateTraitement(incident.getDateTraitement())
                .agentId(incident.getAgent() != null ? incident.getAgent().getId() : null)
                .agentNom(incident.getAgent() != null
                        ? incident.getAgent().getNom() + " " + incident.getAgent().getPrenom()
                        : null)
                .directionNom(incident.getBadge().getEmploye().getDirection() != null
                        ? incident.getBadge().getEmploye().getDirection().getNom()
                        : null)
                .createdAt(incident.getCreatedAt())
                .build();
    }
}
