package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.PassageResponseDTO;
import ma.ram.sigba.dto.SimulationResponseDTO;
import ma.ram.sigba.entity.*;
import ma.ram.sigba.entity.enums.BadgeStatut;
import ma.ram.sigba.entity.enums.HabilitationStatut;
import ma.ram.sigba.entity.enums.ResultatPassage;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.entity.enums.UserStatut;
import ma.ram.sigba.exception.BusinessException;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PassageService {

    private final PassageRepository passageRepository;
    private final BadgeRepository badgeRepository;
    private final HabilitationRepository habilitationRepository;
    private final ZoneRepository zoneRepository;

    @Transactional
    public PassageResponseDTO enregistrerPassage(String uidBadge, Long zoneId, User currentUser) {
        Badge badge = badgeRepository.findByUidUnique(uidBadge)
                .orElseThrow(() -> new ResourceNotFoundException("Badge non trouvé avec l'UID : " + uidBadge));

        if (currentUser.getRole() == UserRole.EMPLOYE && !badge.getEmploye().getId().equals(currentUser.getId())) {
            throw new BusinessException("Vous ne pouvez enregistrer un passage qu'avec votre propre badge");
        }

        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Zone non trouvée avec l'id : " + zoneId));

        boolean autorise = isAuthorized(badge, zone);
        ResultatPassage resultat = autorise ? ResultatPassage.AUTORISE : ResultatPassage.REFUSE;

        Passage passage = Passage.builder()
                .uidBadge(uidBadge)
                .zone(zone)
                .employe(badge.getEmploye())
                .direction(badge.getEmploye().getDirection())
                .resultat(resultat)
                .build();
        passage = passageRepository.save(passage);

        log.info("Passage enregistré : badge={}, zone={}, résultat={}", uidBadge, zone.getNom(), resultat);
        return toResponseDTO(passage);
    }

    public Page<PassageResponseDTO> listerPassages(User currentUser, Long zoneId, Long employeId,
                                                   String search, String direction, String zone,
                                                   ResultatPassage resultat, LocalDateTime dateDebut, LocalDateTime dateFin,
                                                   Pageable pageable) {
        String sch = (search == null || search.isBlank()) ? null : search.trim();
        String dir = (direction == null || direction.isBlank()) ? null : direction.trim();
        String z = (zone == null || zone.isBlank()) ? null : zone.trim();
        Page<Passage> passages;
        if (currentUser.getRole() == UserRole.SUPER_ADMIN) {
            if (employeId != null) {
                passages = passageRepository.findByEmployeIdOrderByHorodatageDesc(employeId, pageable);
            } else {
                passages = passageRepository.search(sch, zoneId, z, dir, resultat, dateDebut, dateFin, pageable);
            }
        } else if (currentUser.getRole() == UserRole.MANAGER) {
            passages = passageRepository.findByEmployeDirectionIdOrderByHorodatageDesc(
                    currentUser.getDirection().getId(), pageable);
        } else if (currentUser.getRole() == UserRole.AGENT_SURETE) {
            passages = passageRepository.search(sch, zoneId, z, dir, resultat, dateDebut, dateFin, pageable);
        } else {
            passages = passageRepository.findByEmployeIdOrderByHorodatageDesc(currentUser.getId(), pageable);
        }
        return passages.map(this::toResponseDTO);
    }

    public PassageResponseDTO getPassageById(Long id) {
        Passage passage = passageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Passage non trouvé avec l'id : " + id));
        return toResponseDTO(passage);
    }

    public Page<PassageResponseDTO> listerPassagesPersonnels(User user, Pageable pageable) {
        return passageRepository.findByEmployeIdOrderByHorodatageDesc(user.getId(), pageable)
                .map(this::toResponseDTO);
    }

    public SimulationResponseDTO simulerPassage(String uidBadge, Long zoneId) {
        Badge badge = badgeRepository.findByUidUnique(uidBadge)
                .orElseThrow(() -> new ResourceNotFoundException("Badge non trouvé avec l'UID : " + uidBadge));

        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Zone non trouvée avec l'id : " + zoneId));

        boolean autorise = isAuthorized(badge, zone);
        String motif = autorise
                ? "Badge actif et habilitation confirmée pour la zone " + zone.getNom()
                : buildMotifRefus(badge, zone);

        return SimulationResponseDTO.builder()
                .uidBadge(uidBadge)
                .zoneId(zoneId)
                .zoneNom(zone.getNom())
                .autorise(autorise)
                .motif(motif)
                .build();
    }

    private boolean isAuthorized(Badge badge, Zone zone) {
        if (badge.getStatut() != BadgeStatut.ACTIF) return false;
        if (badge.getEmploye().getStatut() != UserStatut.ACTIF) return false;
        return habilitationRepository.findByBadgeId(badge.getId()).stream()
                .anyMatch(h -> h.getZone().getId().equals(zone.getId())
                        && h.getStatut() == HabilitationStatut.ACTIVE);
    }

    private String buildMotifRefus(Badge badge, Zone zone) {
        if (badge.getStatut() == BadgeStatut.SUSPENDU) return "Badge suspendu";
        if (badge.getStatut() == BadgeStatut.REVOQUE) return "Badge révoqué";
        if (badge.getStatut() == BadgeStatut.EXPIRE) return "Badge expiré";
        if (badge.getStatut() == BadgeStatut.EN_ATTENTE) return "Badge en attente d'activation";
        if (badge.getEmploye().getStatut() != UserStatut.ACTIF) {
            return badge.getEmploye().getStatut() == UserStatut.SUSPENDU
                    ? "Compte employé suspendu"
                    : "Compte employé désactivé";
        }

        boolean hasHabilitation = habilitationRepository.findByBadgeId(badge.getId()).stream()
                .anyMatch(h -> h.getZone().getId().equals(zone.getId()));
        if (!hasHabilitation) return "Aucune habilitation pour la zone " + zone.getNom();

        return "Accès refusé";
    }

    private PassageResponseDTO toResponseDTO(Passage passage) {
        return PassageResponseDTO.builder()
                .id(passage.getId())
                .uidBadge(passage.getUidBadge())
                .zoneId(passage.getZone().getId())
                .zoneNom(passage.getZone().getNom())
                .employeId(passage.getEmploye().getId())
                .employeNom(passage.getEmploye().getNom() + " " + passage.getEmploye().getPrenom())
                .employeMatricule(passage.getEmploye().getMatricule())
                .directionNom(passage.getDirection() != null ? passage.getDirection().getNom() : null)
                .horodatage(passage.getHorodatage())
                .resultat(passage.getResultat().name())
                .createdAt(passage.getCreatedAt())
                .build();
    }
}
