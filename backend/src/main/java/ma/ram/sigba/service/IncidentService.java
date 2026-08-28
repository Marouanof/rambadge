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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
        if (signalant.getStatut() != UserStatut.ACTIF) {
            throw new BusinessException("Votre compte est désactivé, vous ne pouvez pas signaler d'incident");
        }

        Badge badge = badgeRepository.findById(request.getBadgeId())
                .orElseThrow(() -> new ResourceNotFoundException("Badge non trouvé avec l'id : " + request.getBadgeId()));

        if (badge.getStatut() == BadgeStatut.REVOQUE || badge.getStatut() == BadgeStatut.EXPIRE) {
            throw new BusinessException("Le badge est déjà " + badge.getStatut().name().toLowerCase() + ", impossible de signaler un incident");
        }

        boolean incidentEnCours = incidentRepository.existsByBadgeIdAndStatutIn(
                badge.getId(), List.of(IncidentStatut.PROGRAMME, IncidentStatut.SUSPENDU));
        if (incidentEnCours) {
            throw new BusinessException("Un incident est déjà en cours de traitement sur ce badge. Traitez-le ou attendez sa résolution avant d'en signaler un nouveau.");
        }

        TypeIncident type = TypeIncident.valueOf(request.getTypeIncident().toUpperCase());
        if (type == TypeIncident.FIN_CONTRAT && signalant.getRole() != UserRole.MANAGER && signalant.getRole() != UserRole.SUPER_ADMIN) {
            throw new BusinessException("Seul un MANAGER ou SUPER_ADMIN peut signaler un fin de contrat");
        }

        if (signalant.getRole() != UserRole.SUPER_ADMIN) {
            User employeBadge = badge.getEmploye();
            if (signalant.getRole() == UserRole.MANAGER) {
                Long directionSignalant = signalant.getDirection() != null ? signalant.getDirection().getId() : null;
                Long directionBadge = employeBadge.getDirection() != null ? employeBadge.getDirection().getId() : null;
                if (directionBadge == null || !directionBadge.equals(directionSignalant)) {
                    throw new BusinessException("Ce badge n'appartient pas à votre direction");
                }
            } else if (type != TypeIncident.FIN_CONTRAT && !employeBadge.getId().equals(signalant.getId())) {
                throw new BusinessException("Vous ne pouvez signaler un incident que sur votre propre badge");
            }
        }

        boolean programmee = type == TypeIncident.FIN_CONTRAT
                && request.getDateFinContrat() != null
                && request.getDateFinContrat().isAfter(LocalDate.now());

        Incident incident = Incident.builder()
                .badge(badge)
                .signalant(signalant)
                .typeIncident(type)
                .dateIncident(LocalDateTime.now())
                .commentaire(request.getCommentaire())
                .dateFinContrat(request.getDateFinContrat())
                .statut(programmee ? IncidentStatut.PROGRAMME : IncidentStatut.SUSPENDU)
                .build();
        incident = incidentRepository.save(incident);

        if (type == TypeIncident.FIN_CONTRAT && request.getDateFinContrat() != null) {
            badge.setDateExpiration(request.getDateFinContrat().atTime(LocalTime.MAX));
            badgeRepository.save(badge);
        }

        if (!programmee) {
            suspendreBadge(incident);
        } else {
            log.info("Fin de contrat programmée au {} pour le badge {} (signalant : {})",
                    incident.getDateFinContrat(), badge.getUidUnique(), signalant.getEmail());
        }

        return toResponseDTO(incident);
    }

    private void suspendreBadge(Incident incident) {
        Badge badge = incident.getBadge();
        badge.setStatut(BadgeStatut.SUSPENDU);
        badge.setDateSuspension(LocalDateTime.now());
        badgeRepository.save(badge);

        incident.setStatut(IncidentStatut.SUSPENDU);
        incidentRepository.save(incident);

        TypeIncident type = incident.getTypeIncident();
        List<User> agentsSurete = userRepository.findByRoleAndStatut(UserRole.AGENT_SURETE, UserStatut.ACTIF);
        for (User agent : agentsSurete) {
            notificationService.creerNotification(agent, TypeNotification.INCIDENT_SIGNAL,
                    "Incident " + type.name() + " signalé sur le badge " + badge.getUidUnique() + " (" + badge.getEmploye().getPrenom() + " " + badge.getEmploye().getNom() + ")",
                    "/incidents-surete");
        }

        notificationService.creerNotification(badge.getEmploye(), TypeNotification.SUSPENSION,
                "Votre badge " + badge.getUidUnique() + " a été suspendu suite à un incident signalé (" + type.name() + ").",
                "/mon-historique");

        User manager = badge.getEmploye().getDirection() != null ? badge.getEmploye().getDirection().getManager() : null;
        if (manager != null && !manager.getId().equals(incident.getSignalant().getId())) {
            notificationService.creerNotification(manager, TypeNotification.INCIDENT_DIRECTION,
                    "Incident " + type.name() + " signalé sur le badge de " + badge.getEmploye().getPrenom() + " " + badge.getEmploye().getNom() + " (votre direction)",
                    "/incidents");
        }

        log.info("Incident {} → badge {} suspendu", incident.getId(), badge.getUidUnique());
    }

    @Scheduled(fixedDelay = 60000, initialDelay = 60000)
    @Transactional
    public void suspendreFinsContratEchues() {
        List<Incident> echues = incidentRepository.findByTypeIncidentAndStatutAndDateFinContratLessThanEqual(
                TypeIncident.FIN_CONTRAT, IncidentStatut.PROGRAMME, LocalDate.now());
        for (Incident incident : echues) {
            suspendreBadge(incident);
        }
        if (!echues.isEmpty()) {
            log.info("{} fin(s) de contrat arrivée(s) à échéance → badge(s) suspendu(s)", echues.size());
        }
    }

    public Page<IncidentResponseDTO> listerIncidents(User currentUser, IncidentStatut statut, TypeIncident type, String search, Pageable pageable) {
        String s = (search == null || search.isBlank()) ? null : search.trim();
        Page<Incident> incidents;
        if (currentUser.getRole() == UserRole.SUPER_ADMIN) {
            incidents = incidentRepository.findByFilters(statut, type, s, pageable);
        } else if (currentUser.getRole() == UserRole.MANAGER) {
            incidents = incidentRepository.findByDirectionIdAndFilters(currentUser.getDirection().getId(), statut, type, s, pageable);
        } else if (currentUser.getRole() == UserRole.AGENT_SURETE) {
            incidents = incidentRepository.findByFilters(statut, type, s, pageable);
        } else {
            incidents = incidentRepository.findBySignalantIdOrderByDateIncidentDesc(currentUser.getId(), pageable);
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
        if (agent.getStatut() != UserStatut.ACTIF) {
            throw new BusinessException("Votre compte est désactivé, vous ne pouvez pas traiter d'incident");
        }

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

        notificationService.creerNotification(badge.getEmploye(), TypeNotification.REVOCATION,
                "Votre badge " + badge.getUidUnique() + " a été révoqué définitivement. Vos accès sont annulés.",
                "/mon-historique");

        log.info("Incident {} confirmé → badge révoqué par {}", id, agent.getEmail());
        return toResponseDTO(incident);
    }

    @Transactional
    public IncidentResponseDTO leverSuspension(Long id, User agent) {
        if (agent.getStatut() != UserStatut.ACTIF) {
            throw new BusinessException("Votre compte est désactivé, vous ne pouvez pas traiter d'incident");
        }

        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident non trouvé avec l'id : " + id));

        if (incident.getStatut() != IncidentStatut.SUSPENDU) {
            throw new BusinessException("Seul un incident SUSPENDU peut être levé (statut actuel : " + incident.getStatut() + ")");
        }

        if (incident.getTypeIncident() == TypeIncident.FIN_CONTRAT) {
            throw new BusinessException("Impossible de lever une suspension suite à une fin de contrat : la révocation est la seule option.");
        }

        Badge badge = incident.getBadge();
        badge.setStatut(BadgeStatut.ACTIF);
        badge.setDateSuspension(null);
        badgeRepository.save(badge);

        incident.setStatut(IncidentStatut.LEVE);
        incident.setDateTraitement(LocalDateTime.now());
        incident.setAgent(agent);
        incidentRepository.save(incident);

        notificationService.creerNotification(badge.getEmploye(), TypeNotification.REACTIVATION,
                "Votre badge " + badge.getUidUnique() + " a été réactivé. Vos accès sont rétablis.",
                "/mon-historique");

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
                .employeId(incident.getBadge().getEmploye().getId())
                .employeNom(incident.getBadge().getEmploye().getNom() + " " + incident.getBadge().getEmploye().getPrenom())
                .typeIncident(incident.getTypeIncident().name())
                .dateIncident(incident.getDateIncident())
                .commentaire(incident.getCommentaire())
                .dateFinContrat(incident.getDateFinContrat())
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
