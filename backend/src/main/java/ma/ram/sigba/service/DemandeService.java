package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.*;
import ma.ram.sigba.entity.*;
import ma.ram.sigba.entity.enums.*;
import ma.ram.sigba.exception.BusinessException;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DemandeService {

    private final DemandeRepository demandeRepository;
    private final PieceJustificativeRepository pieceJustificativeRepository;
    private final ValidationN1Repository validationN1Repository;
    private final ValidationN2Repository validationN2Repository;
    private final ZoneDemandeeRepository zoneDemandeeRepository;
    private final ZoneRepository zoneRepository;
    private final BadgeRepository badgeRepository;
    private final HabilitationRepository habilitationRepository;
    private final UserRepository userRepository;
    private final JournalAdminService journalAdminService;
    private final NotificationService notificationService;

    @Transactional
    public DemandeResponseDTO soumettreDemande(SoumettreDemandeRequestDTO request, User employe) {
        long demandesEnCours = demandeRepository.countByEmployeIdAndStatut(employe.getId(), DemandeStatut.EN_ATTENTE_N1)
                + demandeRepository.countByEmployeIdAndStatut(employe.getId(), DemandeStatut.EN_ATTENTE_N2);
        if (demandesEnCours > 0) {
            throw new BusinessException("Vous avez déjà une demande en cours. Veuillez attendre son traitement.");
        }

        if (badgeRepository.existsByEmployeIdAndStatutIn(employe.getId(),
                List.of(BadgeStatut.ACTIF, BadgeStatut.SUSPENDU))) {
            throw new BusinessException("Vous avez déjà un badge actif ou suspendu. Impossible de soumettre une nouvelle demande.");
        }

        Demande demande = Demande.builder()
                .employe(employe)
                .statut(DemandeStatut.EN_ATTENTE_N1)
                .build();
        demande = demandeRepository.save(demande);

        for (SoumettreDemandeRequestDTO.PieceJustificativeDTO piece : request.getPieces()) {
            TypePiece typePiece = TypePiece.valueOf(piece.getTypePiece());
            PieceJustificative pj = PieceJustificative.builder()
                    .demande(demande)
                    .typePiece(typePiece)
                    .fichierUrl(piece.getFichierUrl())
                    .build();
            pieceJustificativeRepository.save(pj);
        }

        if (employe.getDirection() != null) {
            Long demandeId = demande.getId();
            userRepository.findByDirectionIdAndRole(employe.getDirection().getId(), UserRole.MANAGER, PageRequest.of(0, 1))
                    .stream().findFirst().ifPresent(manager ->
                        notificationService.creerNotification(manager, TypeNotification.DEMANDE_N1,
                                employe.getPrenom() + " " + employe.getNom() + " a soumis une nouvelle demande de badge",
                                "/demandes/" + demandeId));
        }

        log.info("Demande {} soumise par {} {}", demande.getId(), employe.getPrenom(), employe.getNom());
        return toResponseDTO(demande);
    }

    public Page<DemandeResponseDTO> listerDemandes(User user, Pageable pageable) {
        Page<Demande> demandes;
        switch (user.getRole()) {
            case EMPLOYE -> demandes = demandeRepository.findByEmployeIdOrderByCreatedAtDesc(user.getId(), pageable);
            case MANAGER -> {
                if (user.getDirection() == null) {
                    throw new BusinessException("Aucune direction assignée");
                }
                demandes = demandeRepository.findByDirectionId(user.getDirection().getId(), pageable);
            }
            case AGENT_SURETE , SUPER_ADMIN -> demandes = demandeRepository.findByStatutOrderByCreatedAtDesc(DemandeStatut.EN_ATTENTE_N2, pageable);
            default -> throw new BusinessException("Rôle non autorisé à consulter les demandes");
        }
        return demandes.map(this::toResponseDTO);
    }

    public Page<DemandeResponseDTO> listerToutesLesDemandes(Pageable pageable) {
        Page<Demande> demandes = demandeRepository.findAllByOrderByCreatedAtDesc(pageable);
        return demandes.map(this::toResponseDTO);
    }

    public DemandeResponseDTO getDemandeById(Long id, User user) {
        Demande demande = findDemandeById(id);
        switch (user.getRole()) {
            case EMPLOYE -> {
                if (!demande.getEmploye().getId().equals(user.getId())) {
                    throw new BusinessException("Accès refusé : cette demande ne vous appartient pas");
                }
            }
            case MANAGER -> {
                if (user.getDirection() == null || !user.getDirection().getId().equals(demande.getEmploye().getDirection().getId())) {
                    throw new BusinessException("Accès refusé : cette demande ne concerne pas votre direction");
                }
            }
            default -> {}
        }
        return toResponseDTO(demande);
    }

    @Transactional
    public DemandeResponseDTO validerN1(Long demandeId, ValiderN1RequestDTO request, User manager) {
        Demande demande = findDemandeById(demandeId);
        if (!DemandeStatut.EN_ATTENTE_N1.equals(demande.getStatut())) {
            throw new BusinessException("Cette demande n'est pas en attente de validation N1");
        }
        if (manager.getDirection() == null || !manager.getDirection().getId().equals(demande.getEmploye().getDirection().getId())) {
            throw new BusinessException("Accès refusé : cette demande ne concerne pas votre direction");
        }

        ValidationN1 validation = ValidationN1.builder()
                .demande(demande)
                .manager(manager)
                .decision(Decision.VALIDEE)
                .justifications(request.getJustifications())
                .dateValidation(LocalDateTime.now())
                .build();
        validationN1Repository.save(validation);

        for (ValiderN1RequestDTO.ZoneSelectionDTO zoneSelection : request.getZones()) {
            Zone zone = zoneRepository.findById(zoneSelection.getZoneId())
                    .orElseThrow(() -> new ResourceNotFoundException("Zone non trouvée : " + zoneSelection.getZoneId()));
            ZoneDemandee zd = ZoneDemandee.builder()
                    .demande(demande)
                    .zone(zone)
                    .justification(zoneSelection.getJustification())
                    .statutN1(ZoneDemandeeStatut.VALIDEE)
                    .build();
            zoneDemandeeRepository.save(zd);
        }

        demande.setStatut(DemandeStatut.EN_ATTENTE_N2);
        demande = demandeRepository.save(demande);

        journalAdminService.journaliser(manager.getId(), "VALIDATION_N1", "Demande", demande.getId(),
                "Validation N1 de la demande de " + demande.getEmploye().getPrenom() + " " + demande.getEmploye().getNom());

        notificationService.creerNotification(demande.getEmploye(), TypeNotification.VALIDATION,
                "Votre demande de badge a été validée en N1 par " + manager.getPrenom() + " " + manager.getNom(),
                "/demandes/" + demande.getId());

        log.info("Demande {} validée en N1 par {} {}", demande.getId(), manager.getPrenom(), manager.getNom());
        return toResponseDTO(demande);
    }

    @Transactional
    public DemandeResponseDTO refuserN1(Long demandeId, RefuserRequestDTO request, User manager) {
        Demande demande = findDemandeById(demandeId);
        if (!DemandeStatut.EN_ATTENTE_N1.equals(demande.getStatut())) {
            throw new BusinessException("Cette demande n'est pas en attente de validation N1");
        }
        if (manager.getDirection() == null || !manager.getDirection().getId().equals(demande.getEmploye().getDirection().getId())) {
            throw new BusinessException("Accès refusé : cette demande ne concerne pas votre direction");
        }

        ValidationN1 validation = ValidationN1.builder()
                .demande(demande)
                .manager(manager)
                .decision(Decision.REFUSEE)
                .motifRefus(request.getMotifRefus())
                .dateValidation(LocalDateTime.now())
                .build();
        validationN1Repository.save(validation);

        demande.setStatut(DemandeStatut.REFUSEE_N1);
        demande.setMotifRefus(request.getMotifRefus());
        demande = demandeRepository.save(demande);

        journalAdminService.journaliser(manager.getId(), "REFUS_N1", "Demande", demande.getId(),
                "Refus N1 de la demande de " + demande.getEmploye().getPrenom() + " " + demande.getEmploye().getNom() + " — motif : " + request.getMotifRefus());

        notificationService.creerNotification(demande.getEmploye(), TypeNotification.REFUS,
                "Votre demande de badge a été refusée en N1 — motif : " + request.getMotifRefus(),
                "/demandes/" + demande.getId());

        log.info("Demande {} refusée en N1 par {} {}", demande.getId(), manager.getPrenom(), manager.getNom());
        return toResponseDTO(demande);
    }

    @Transactional
    public DemandeResponseDTO validerN2(Long demandeId, ValiderN2RequestDTO request, User agent) {
        Demande demande = findDemandeById(demandeId);
        if (!DemandeStatut.EN_ATTENTE_N2.equals(demande.getStatut())) {
            throw new BusinessException("Cette demande n'est pas en attente de validation N2");
        }

        ValidationN2 validation = ValidationN2.builder()
                .demande(demande)
                .agent(agent)
                .decision(Decision.VALIDEE)
                .casierJudiciaire(request.getChecklistConformite().isCasierJudiciaire())
                .attestationFormation(request.getChecklistConformite().isAttestationFormation())
                .justificationPoste(request.getChecklistConformite().isJustificationPoste())
                .pieceIdentite(request.getChecklistConformite().isPieceIdentite())
                .dateValidation(LocalDateTime.now())
                .build();
        validationN2Repository.save(validation);

        List<ZoneDemandee> zonesDemandees = zoneDemandeeRepository.findByDemandeId(demandeId);
        for (ValiderN2RequestDTO.ZoneDecisionDTO zdRequest : request.getZones()) {
            ZoneDemandee zd = zonesDemandees.stream()
                    .filter(z -> z.getId().equals(zdRequest.getZoneDemandeeId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Zone demandée non trouvée : " + zdRequest.getZoneDemandeeId()));
            zd.setStatutN2(zdRequest.isValidee() ? ZoneDemandeeStatut.VALIDEE : ZoneDemandeeStatut.REFUSEE);
            zoneDemandeeRepository.save(zd);
        }

        badgeRepository.findByEmployeId(demande.getEmploye().getId())
                .filter(old -> old.getStatut() == BadgeStatut.REVOQUE)
                .ifPresent(old -> {
                    old.setStatut(BadgeStatut.EXPIRE);
                    badgeRepository.save(old);
                });

        Badge badge = Badge.builder()
                .uidUnique(genererUID())
                .employe(demande.getEmploye())
                .demande(demande)
                .statut(BadgeStatut.ACTIF)
                .dateEmission(LocalDateTime.now())
                .dateExpiration(LocalDateTime.now().plusYears(1))
                .build();
        badge = badgeRepository.save(badge);

        List<ZoneDemandee> zonesValidees = zonesDemandees.stream()
                .filter(z -> ZoneDemandeeStatut.VALIDEE.equals(z.getStatutN2()))
                .toList();
        for (ZoneDemandee zd : zonesValidees) {
            Habilitation hab = Habilitation.builder()
                    .badge(badge)
                    .zone(zd.getZone())
                    .dateAttribution(LocalDateTime.now())
                    .statut(HabilitationStatut.ACTIVE)
                    .build();
            habilitationRepository.save(hab);
        }

        demande.setStatut(DemandeStatut.VALIDEE);
        demande = demandeRepository.save(demande);

        journalAdminService.journaliser(agent.getId(), "VALIDATION_N2", "Demande", demande.getId(),
                "Validation N2 de la demande de " + demande.getEmploye().getPrenom() + " " + demande.getEmploye().getNom() + " — Badge UID: " + badge.getUidUnique());

        notificationService.creerNotification(demande.getEmploye(), TypeNotification.VALIDATION,
                "Votre badge a été émis avec succès — UID : " + badge.getUidUnique(),
                "/demandes/" + demande.getId());

        log.info("Demande {} validée en N2 — Badge {} émis", demande.getId(), badge.getUidUnique());
        return toResponseDTO(demande);
    }

    @Transactional
    public DemandeResponseDTO refuserN2(Long demandeId, RefuserRequestDTO request, User agent) {
        Demande demande = findDemandeById(demandeId);
        if (!DemandeStatut.EN_ATTENTE_N2.equals(demande.getStatut())) {
            throw new BusinessException("Cette demande n'est pas en attente de validation N2");
        }

        ValidationN2 validation = ValidationN2.builder()
                .demande(demande)
                .agent(agent)
                .decision(Decision.REFUSEE)
                .motifRefus(request.getMotifRefus())
                .dateValidation(LocalDateTime.now())
                .build();
        validationN2Repository.save(validation);

        demande.setStatut(DemandeStatut.REFUSEE_N2);
        demande.setMotifRefus(request.getMotifRefus());
        demande = demandeRepository.save(demande);

        journalAdminService.journaliser(agent.getId(), "REFUS_N2", "Demande", demande.getId(),
                "Refus N2 de la demande de " + demande.getEmploye().getPrenom() + " " + demande.getEmploye().getNom() + " — motif : " + request.getMotifRefus());

        notificationService.creerNotification(demande.getEmploye(), TypeNotification.REFUS,
                "Votre demande de badge a été refusée en N2 — motif : " + request.getMotifRefus(),
                "/demandes/" + demande.getId());

        log.info("Demande {} refusée en N2 par {} {}", demande.getId(), agent.getPrenom(), agent.getNom());
        return toResponseDTO(demande);
    }

    public List<DemandeResponseDTO.PieceJustificativeResponseDTO> listerPieces(Long demandeId) {
        return pieceJustificativeRepository.findByDemandeId(demandeId).stream()
                .map(p -> DemandeResponseDTO.PieceJustificativeResponseDTO.builder()
                        .id(p.getId())
                        .typePiece(p.getTypePiece().name())
                        .fichierUrl(p.getFichierUrl())
                        .build())
                .toList();
    }

    private Demande findDemandeById(Long id) {
        return demandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande non trouvée avec l'id : " + id));
    }

    private String genererUID() {
        return String.format("%02X:%02X:%02X:%02X",
                UUID.randomUUID().getLeastSignificantBits() & 0xFF,
                (UUID.randomUUID().getLeastSignificantBits() >> 8) & 0xFF,
                (UUID.randomUUID().getLeastSignificantBits() >> 16) & 0xFF,
                (UUID.randomUUID().getLeastSignificantBits() >> 24) & 0xFF);
    }

    private DemandeResponseDTO toResponseDTO(Demande demande) {
        User employe = demande.getEmploye();
        User employeFull = userRepository.findById(employe.getId()).orElse(employe);

        List<DemandeResponseDTO.PieceJustificativeResponseDTO> pieces = pieceJustificativeRepository.findByDemandeId(demande.getId()).stream()
                .map(p -> DemandeResponseDTO.PieceJustificativeResponseDTO.builder()
                        .id(p.getId())
                        .typePiece(p.getTypePiece().name())
                        .fichierUrl(p.getFichierUrl())
                        .build())
                .toList();

        List<DemandeResponseDTO.ZoneDemandeeResponseDTO> zones = zoneDemandeeRepository.findByDemandeId(demande.getId()).stream()
                .map(z -> DemandeResponseDTO.ZoneDemandeeResponseDTO.builder()
                        .id(z.getId())
                        .zoneId(z.getZone().getId())
                        .zoneNom(z.getZone().getNom())
                        .justification(z.getJustification())
                        .statutN1(z.getStatutN1().name())
                        .statutN2(z.getStatutN2().name())
                        .build())
                .toList();

        DemandeResponseDTO.ValidationN1ResponseDTO valN1 = validationN1Repository.findByDemandeId(demande.getId())
                .map(v -> DemandeResponseDTO.ValidationN1ResponseDTO.builder()
                        .id(v.getId())
                        .managerNom(v.getManager().getPrenom() + " " + v.getManager().getNom())
                        .decision(v.getDecision().name())
                        .justifications(v.getJustifications())
                        .motifRefus(v.getMotifRefus())
                        .dateValidation(v.getDateValidation())
                        .build())
                .orElse(null);

        DemandeResponseDTO.ValidationN2ResponseDTO valN2 = validationN2Repository.findByDemandeId(demande.getId())
                .map(v -> DemandeResponseDTO.ValidationN2ResponseDTO.builder()
                        .id(v.getId())
                        .agentNom(v.getAgent().getPrenom() + " " + v.getAgent().getNom())
                        .decision(v.getDecision().name())
                        .checklistConformite(ChecklistConformiteDTO.builder()
                                .casierJudiciaire(v.isCasierJudiciaire())
                                .attestationFormation(v.isAttestationFormation())
                                .justificationPoste(v.isJustificationPoste())
                                .pieceIdentite(v.isPieceIdentite())
                                .build())
                        .motifRefus(v.getMotifRefus())
                        .dateValidation(v.getDateValidation())
                        .build())
                .orElse(null);

        return DemandeResponseDTO.builder()
                .id(demande.getId())
                .employeNom(employeFull.getNom())
                .employePrenom(employeFull.getPrenom())
                .employeEmail(employeFull.getEmail())
                .directionNom(employeFull.getDirection() != null ? employeFull.getDirection().getNom() : null)
                .statut(demande.getStatut().name())
                .motifRefus(demande.getMotifRefus())
                .createdAt(demande.getCreatedAt())
                .updatedAt(demande.getUpdatedAt())
                .pieces(pieces)
                .zonesDemandees(zones)
                .validationN1(valN1)
                .validationN2(valN2)
                .build();
    }
}
