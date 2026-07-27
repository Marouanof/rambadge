package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.BadgeResponseDTO;
import ma.ram.sigba.dto.HabilitationResponseDTO;
import ma.ram.sigba.entity.Badge;
import ma.ram.sigba.entity.Habilitation;
import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.enums.BadgeStatut;
import ma.ram.sigba.entity.enums.HabilitationStatut;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.exception.BusinessException;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.BadgeRepository;
import ma.ram.sigba.repository.HabilitationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final HabilitationRepository habilitationRepository;

    public Page<BadgeResponseDTO> listerBadges(User currentUser, Pageable pageable) {
        Page<Badge> badges;
        if (currentUser.getRole() == UserRole.SUPER_ADMIN) {
            badges = badgeRepository.findAll(pageable);
        } else if (currentUser.getRole() == UserRole.MANAGER) {
            badges = badgeRepository.findByEmployeDirectionId(currentUser.getDirection().getId(), pageable);
        } else if (currentUser.getRole() == UserRole.AGENT_SURETE) {
            badges = badgeRepository.findAll(pageable);
        } else {
            return Page.empty(pageable);
        }
        return badges.map(this::toResponseDTO);
    }

    public Page<BadgeResponseDTO> listerBadgesParStatut(String statut, Pageable pageable) {
        BadgeStatut badgeStatut = BadgeStatut.valueOf(statut.toUpperCase());
        return badgeRepository.findByStatut(badgeStatut, pageable).map(this::toResponseDTO);
    }

    public BadgeResponseDTO getBadgeById(Long id) {
        Badge badge = badgeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Badge non trouvé avec l'id : " + id));
        return toResponseDTO(badge);
    }

    public BadgeResponseDTO getBadgeByUid(String uid) {
        Badge badge = badgeRepository.findByUidUnique(uid)
                .orElseThrow(() -> new ResourceNotFoundException("Badge non trouvé avec l'UID : " + uid));
        return toResponseDTO(badge);
    }

    public BadgeResponseDTO getBadgeByEmployeId(Long employeId) {
        Badge badge = badgeRepository.findByEmployeId(employeId)
                .orElseThrow(() -> new ResourceNotFoundException("Aucun badge trouvé pour cet employé"));
        return toResponseDTO(badge);
    }

    public BadgeResponseDTO getBadgeByEmployeIdOptional(Long employeId) {
        return badgeRepository.findFirstByEmployeIdAndStatutIn(employeId,
                java.util.List.of(BadgeStatut.ACTIF, BadgeStatut.SUSPENDU))
                .map(this::toResponseDTO)
                .orElse(null);
    }

    @Transactional
    public BadgeResponseDTO suspendreBadge(Long id) {
        Badge badge = badgeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Badge non trouvé avec l'id : " + id));

        if (badge.getStatut() != BadgeStatut.ACTIF) {
            throw new BusinessException("Seul un badge ACTIF peut être suspendu (statut actuel : " + badge.getStatut() + ")");
        }

        badge.setStatut(BadgeStatut.SUSPENDU);
        badge.setDateSuspension(LocalDateTime.now());
        badgeRepository.save(badge);

        log.info("Badge {} suspendu (UID: {})", id, badge.getUidUnique());
        return toResponseDTO(badge);
    }

    @Transactional
    public BadgeResponseDTO reactiverBadge(Long id) {
        Badge badge = badgeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Badge non trouvé avec l'id : " + id));

        if (badge.getStatut() != BadgeStatut.SUSPENDU) {
            throw new BusinessException("Seul un badge SUSPENDU peut être réactivé (statut actuel : " + badge.getStatut() + ")");
        }

        badge.setStatut(BadgeStatut.ACTIF);
        badge.setDateSuspension(null);
        badgeRepository.save(badge);

        log.info("Badge {} réactivé (UID: {})", id, badge.getUidUnique());
        return toResponseDTO(badge);
    }

    @Transactional
    public BadgeResponseDTO revoquerBadge(Long id) {
        Badge badge = badgeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Badge non trouvé avec l'id : " + id));

        if (badge.getStatut() == BadgeStatut.REVOQUE) {
            throw new BusinessException("Le badge est déjà révoqué");
        }
        if (badge.getStatut() == BadgeStatut.EXPIRE) {
            throw new BusinessException("Un badge EXPIRE ne peut pas être révoqué");
        }

        badge.setStatut(BadgeStatut.REVOQUE);
        badge.setDateRevocation(LocalDateTime.now());
        badgeRepository.save(badge);

        habilitationRepository.findByBadgeId(id).forEach(h -> {
            h.setStatut(HabilitationStatut.REVOQUEE);
            h.setDateRevocation(LocalDateTime.now());
        });
        habilitationRepository.saveAll(habilitationRepository.findByBadgeId(id));

        log.info("Badge {} révoqué (UID: {}) — {} habilitations révoquées", id, badge.getUidUnique(),
                habilitationRepository.findByBadgeId(id).size());
        return toResponseDTO(badge);
    }

    @Transactional
    public void expirerBadges() {
        LocalDateTime now = LocalDateTime.now();
        badgeRepository.findByStatut(BadgeStatut.ACTIF, Pageable.unpaged()).forEach(badge -> {
            if (badge.getDateExpiration() != null && badge.getDateExpiration().isBefore(now)) {
                badge.setStatut(BadgeStatut.EXPIRE);
                badgeRepository.save(badge);

                habilitationRepository.findByBadgeId(badge.getId()).forEach(h -> {
                    h.setStatut(HabilitationStatut.REVOQUEE);
                    h.setDateRevocation(now);
                });
                habilitationRepository.saveAll(habilitationRepository.findByBadgeId(badge.getId()));

                log.info("Badge {} expiré (UID: {})", badge.getId(), badge.getUidUnique());
            }
        });
    }

    public BadgeResponseDTO toResponseDTO(Badge badge) {
        return BadgeResponseDTO.builder()
                .id(badge.getId())
                .uidUnique(badge.getUidUnique())
                .employeId(badge.getEmploye().getId())
                .employeNom(badge.getEmploye().getNom())
                .employePrenom(badge.getEmploye().getPrenom())
                .employeEmail(badge.getEmploye().getEmail())
                .demandeId(badge.getDemande().getId())
                .statut(badge.getStatut().name())
                .dateEmission(badge.getDateEmission())
                .dateExpiration(badge.getDateExpiration())
                .dateSuspension(badge.getDateSuspension())
                .dateRevocation(badge.getDateRevocation())
                .habilitations(habilitationRepository.findByBadgeId(badge.getId()).stream()
                        .map(this::toHabilitationResponseDTO).toList())
                .createdAt(badge.getCreatedAt())
                .build();
    }

    public HabilitationResponseDTO toHabilitationResponseDTO(Habilitation h) {
        return HabilitationResponseDTO.builder()
                .id(h.getId())
                .badgeId(h.getBadge().getId())
                .zoneId(h.getZone().getId())
                .zoneNom(h.getZone().getNom())
                .zoneCode(h.getZone().getCode())
                .statut(h.getStatut().name())
                .dateAttribution(h.getDateAttribution())
                .dateRevocation(h.getDateRevocation())
                .build();
    }
}
