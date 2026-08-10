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
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    private final NotificationService notificationService;

    @Transactional
    public DemandeResponseDTO soumettreDemande(SoumettreDemandeRequestDTO request, User employe) {
        if (employe.getStatut() != ma.ram.sigba.entity.enums.UserStatut.ACTIF) {
            throw new BusinessException("Votre compte est suspendu, vous ne pouvez plus soumettre de demande de badge");
        }

        if (employe.getDirection() != null && "INACTIF".equals(employe.getDirection().getStatut())) {
            throw new BusinessException("Votre direction est désactivée, vous ne pouvez plus soumettre de demande de badge");
        }

        long demandesEnCours = demandeRepository.countByEmployeIdAndStatut(employe.getId(), DemandeStatut.EN_ATTENTE_N1)
                + demandeRepository.countByEmployeIdAndStatut(employe.getId(), DemandeStatut.EN_ATTENTE_N2);
        if (demandesEnCours > 0) {
            throw new BusinessException("Vous avez déjà une demande en cours. Veuillez attendre son traitement.");
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

        for (Long zoneId : request.getZoneIds()) {
            Zone zone = zoneRepository.findById(zoneId)
                    .orElseThrow(() -> new ResourceNotFoundException("Zone non trouvée : " + zoneId));
            ZoneDemandee zd = ZoneDemandee.builder()
                    .demande(demande)
                    .zone(zone)
                    .build();
            zoneDemandeeRepository.save(zd);
        }

        User manager = employe.getDirection() != null ? employe.getDirection().getManager() : null;
        if (manager != null) {
            notificationService.creerNotification(manager, TypeNotification.DEMANDE_N1,
                    "Nouvelle demande de badge de " + employe.getPrenom() + " " + employe.getNom() + " en attente de validation",
                    "/validations");
        }

        log.info("Demande {} soumise par {} {}", demande.getId(), employe.getPrenom(), employe.getNom());
        return toResponseDTO(demande);
    }

    public Page<DemandeResponseDTO> listerDemandes(User user, DemandeStatut statut, Pageable pageable) {
        Page<Demande> demandes;
        switch (user.getRole()) {
            case EMPLOYE -> demandes = demandeRepository.findByEmployeIdOrderByCreatedAtDesc(user.getId(), pageable);
            case MANAGER -> {
                verifierCompteActif(user);
                if (user.getDirection() == null) {
                    throw new BusinessException("Aucune direction assignée");
                }
                if (statut != null) {
                    demandes = demandeRepository.findByDirectionIdAndStatutOrderByCreatedAtAsc(user.getDirection().getId(), statut, pageable);
                } else {
                    demandes = demandeRepository.findByDirectionId(user.getDirection().getId(), pageable);
                }
            }
            case AGENT_SURETE , SUPER_ADMIN -> {
                verifierCompteActif(user);
                demandes = demandeRepository.findByStatutOrderByCreatedAtAsc(DemandeStatut.EN_ATTENTE_N2, pageable);
            }
            default -> throw new BusinessException("Rôle non autorisé à consulter les demandes");
        }
        return demandes.map(this::toResponseDTO);
    }

    private void verifierCompteActif(User user) {
        if (user.getStatut() != UserStatut.ACTIF) {
            throw new BusinessException("Votre compte est désactivé");
        }
    }

    public Page<DemandeResponseDTO> listerDemandesEnAttenteN1Manager(User manager, Pageable pageable) {
        verifierCompteActif(manager);
        if (manager.getDirection() == null) {
            throw new BusinessException("Aucune direction assignée");
        }
        Page<Demande> demandes = demandeRepository.findByDirectionIdAndStatutOrderByCreatedAtAsc(
                manager.getDirection().getId(), DemandeStatut.EN_ATTENTE_N1, pageable);
        return demandes.map(this::toResponseDTO);
    }

    public Page<DemandeResponseDTO> listerToutesLesDemandes(String search, String direction, DemandeStatut statut,
                                                            LocalDateTime dateDebut, LocalDateTime dateFin, Pageable pageable) {
        Page<Demande> demandes = demandeRepository.search(
                blankToNull(search), blankToNull(direction), statut, dateDebut, dateFin, pageable);
        return demandes.map(this::toResponseDTO);
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    public DemandeResponseDTO getDemandeById(Long id, User user) {
        verifierCompteActif(user);
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
        verifierCompteActif(manager);
        Demande demande = findDemandeById(demandeId);
        if (!DemandeStatut.EN_ATTENTE_N1.equals(demande.getStatut())) {
            throw new BusinessException("Cette demande n'est pas en attente de validation N1");
        }
        if (manager.getDirection() == null || !manager.getDirection().getId().equals(demande.getEmploye().getDirection().getId())) {
            throw new BusinessException("Accès refusé : cette demande ne concerne pas votre direction");
        }

        demande.setDateFinContrat(request.getDateFinContrat());

        ValidationN1 validation = ValidationN1.builder()
                .demande(demande)
                .manager(manager)
                .decision(Decision.VALIDEE)
                .dateValidation(LocalDateTime.now())
                .build();
        validationN1Repository.save(validation);

        List<ZoneDemandee> zonesDemandees = zoneDemandeeRepository.findByDemandeId(demandeId);
        Set<Long> zonesFinales = new HashSet<>(request.getZoneIds());

        for (ZoneDemandee zd : zonesDemandees) {
            if (!zonesFinales.contains(zd.getZone().getId())) {
                zoneDemandeeRepository.delete(zd);
            } else {
                zd.setStatutN1(ZoneDemandeeStatut.VALIDEE);
                zoneDemandeeRepository.save(zd);
            }
        }

        Set<Long> zonesExistantes = zonesDemandees.stream()
                .map(zd -> zd.getZone().getId())
                .collect(Collectors.toSet());
        for (Long zoneId : zonesFinales) {
            if (!zonesExistantes.contains(zoneId)) {
                Zone zone = zoneRepository.findById(zoneId)
                        .orElseThrow(() -> new ResourceNotFoundException("Zone non trouvée : " + zoneId));
                ZoneDemandee zd = ZoneDemandee.builder()
                        .demande(demande)
                        .zone(zone)
                        .statutN1(ZoneDemandeeStatut.VALIDEE)
                        .build();
                zoneDemandeeRepository.save(zd);
            }
        }

        demande.setStatut(DemandeStatut.EN_ATTENTE_N2);
        demande = demandeRepository.save(demande);

        List<User> agentsSurete = userRepository.findByRoleAndStatut(UserRole.AGENT_SURETE, UserStatut.ACTIF);
        for (User agent : agentsSurete) {
            notificationService.creerNotification(agent, TypeNotification.DEMANDE_N2,
                    "Demande de badge de " + demande.getEmploye().getPrenom() + " " + demande.getEmploye().getNom() + " en attente de validation N2",
                    "/dossiers-n2");
        }

        log.info("Demande {} validée en N1 par {} {}", demande.getId(), manager.getPrenom(), manager.getNom());
        return toResponseDTO(demande);
    }

    @Transactional
    public DemandeResponseDTO refuserN1(Long demandeId, RefuserRequestDTO request, User manager) {
        verifierCompteActif(manager);
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

        for (ZoneDemandee zd : zoneDemandeeRepository.findByDemandeId(demandeId)) {
            zd.setStatutN1(ZoneDemandeeStatut.REFUSEE);
            zoneDemandeeRepository.save(zd);
        }

        demande.setStatut(DemandeStatut.REFUSEE_N1);
        demande.setMotifRefus(request.getMotifRefus());
        demande = demandeRepository.save(demande);

        notificationService.creerNotification(demande.getEmploye(), TypeNotification.REFUS,
                "Votre demande de badge a été refusée en N1 par " + manager.getPrenom() + " " + manager.getNom() + " — Motif : " + request.getMotifRefus(),
                "/ma-demande");

        log.info("Demande {} refusée en N1 par {} {}", demande.getId(), manager.getPrenom(), manager.getNom());
        return toResponseDTO(demande);
    }

    @Transactional
    public DemandeResponseDTO validerN2(Long demandeId, ValiderN2RequestDTO request, User agent) {
        verifierCompteActif(agent);
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
        Map<Long, ZoneDemandee> zonesParId = zonesDemandees.stream()
                .collect(Collectors.toMap(ZoneDemandee::getId, Function.identity()));

        boolean auMoinsUneValidee = false;
        for (ValiderN2RequestDTO.ZoneDecisionDTO zdRequest : request.getZones()) {
            ZoneDemandee zd = zonesParId.get(zdRequest.getZoneDemandeeId());
            if (zd == null) {
                throw new ResourceNotFoundException("Zone demandée non trouvée : " + zdRequest.getZoneDemandeeId());
            }
            if (zdRequest.isValidee()) {
                zd.setStatutN2(ZoneDemandeeStatut.VALIDEE);
                zd.setMotifRefus(null);
                auMoinsUneValidee = true;
            } else {
                if (zdRequest.getMotifRefus() == null || zdRequest.getMotifRefus().isBlank()) {
                    throw new BusinessException("Le motif de refus est obligatoire pour la zone " + zd.getZone().getNom());
                }
                zd.setStatutN2(ZoneDemandeeStatut.REFUSEE);
                zd.setMotifRefus(zdRequest.getMotifRefus());
            }
            zoneDemandeeRepository.save(zd);
        }
        if (!auMoinsUneValidee) {
            throw new BusinessException("Au moins une zone doit être validée — utilisez le refus global si aucune zone n'est autorisée");
        }

        LocalDateTime dateExpiration = demande.getDateFinContrat() != null
                ? demande.getDateFinContrat().atTime(LocalTime.MAX)
                : LocalDateTime.now().plusYears(1);

        Badge badge = Badge.builder()
                .uidUnique(genererUID())
                .employe(demande.getEmploye())
                .demande(demande)
                .statut(BadgeStatut.ACTIF)
                .dateEmission(LocalDateTime.now())
                .dateExpiration(dateExpiration)
                .build();
        badge = badgeRepository.save(badge);

        for (ZoneDemandee zd : zonesDemandees) {
            if (ZoneDemandeeStatut.VALIDEE.equals(zd.getStatutN2())) {
                Habilitation hab = Habilitation.builder()
                        .badge(badge)
                        .zone(zd.getZone())
                        .dateAttribution(LocalDateTime.now())
                        .statut(HabilitationStatut.ACTIVE)
                        .build();
                habilitationRepository.save(hab);
            }
        }

        demande.setStatut(DemandeStatut.VALIDEE);
        demande = demandeRepository.save(demande);

        notificationService.creerNotification(demande.getEmploye(), TypeNotification.VALIDATION,
                "Votre demande de badge a été validée. Badge " + badge.getUidUnique() + " émis avec succès.",
                "/ma-demande");

        log.info("Demande {} validée en N2 — Badge {} émis", demande.getId(), badge.getUidUnique());
        return toResponseDTO(demande);
    }

    @Transactional
    public DemandeResponseDTO refuserN2(Long demandeId, RefuserRequestDTO request, User agent) {
        verifierCompteActif(agent);
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

        List<ZoneDemandee> zonesDemandees = zoneDemandeeRepository.findByDemandeId(demandeId);
        for (ZoneDemandee zd : zonesDemandees) {
            zd.setStatutN2(ZoneDemandeeStatut.REFUSEE);
            zd.setMotifRefus(request.getMotifRefus());
            zoneDemandeeRepository.save(zd);
        }

        demande.setStatut(DemandeStatut.REFUSEE_N2);
        demande.setMotifRefus(request.getMotifRefus());
        demande = demandeRepository.save(demande);

        notificationService.creerNotification(demande.getEmploye(), TypeNotification.REFUS,
                "Votre demande de badge a été refusée en N2 par " + agent.getPrenom() + " " + agent.getNom() + " — Motif : " + request.getMotifRefus(),
                "/ma-demande");

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
                .employePoste(employeFull.getPoste())
                .directionNom(employeFull.getDirection() != null ? employeFull.getDirection().getNom() : null)
                .statut(demande.getStatut().name())
                .motifRefus(demande.getMotifRefus())
                .dateFinContrat(demande.getDateFinContrat())
                .createdAt(demande.getCreatedAt())
                .updatedAt(demande.getUpdatedAt())
                .pieces(pieces)
                .zonesDemandees(zones)
                .validationN1(valN1)
                .validationN2(valN2)
                .build();
    }
}
