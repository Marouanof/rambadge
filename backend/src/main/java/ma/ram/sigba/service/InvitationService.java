package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.AcceptInvitationRequestDTO;
import ma.ram.sigba.dto.InvitationRequestDTO;
import ma.ram.sigba.dto.InvitationResponseDTO;
import ma.ram.sigba.entity.Direction;
import ma.ram.sigba.entity.Invitation;
import ma.ram.sigba.entity.Poste;
import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.enums.InvitationStatut;
import ma.ram.sigba.entity.enums.TypeNotification;
import ma.ram.sigba.entity.enums.UserRole;
import ma.ram.sigba.entity.enums.UserStatut;
import ma.ram.sigba.exception.BusinessException;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.InvitationRepository;
import ma.ram.sigba.repository.PosteRepository;
import ma.ram.sigba.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final PosteRepository posteRepository;
    private final EmailService emailService;
    private final KeycloakService keycloakService;
    private final NotificationService notificationService;

    @Transactional
    public InvitationResponseDTO genererInvitation(InvitationRequestDTO request, User auteur) {
        if (!UserRole.MANAGER.equals(auteur.getRole())) {
            throw new BusinessException("Seul un manager peut générer des invitations");
        }

        if (auteur.getDirection() == null) {
            throw new BusinessException("Vous n'avez pas de direction assignée");
        }

        if ("INACTIF".equals(auteur.getDirection().getStatut())) {
            throw new BusinessException("Votre direction est désactivée, vous ne pouvez plus générer d'invitations");
        }

        if (invitationRepository.existsByEmailDestinataireAndStatut(request.getEmailDestinataire(), InvitationStatut.EN_ATTENTE)) {
            throw new BusinessException("Une invitation en attente existe déjà pour l'email '" + request.getEmailDestinataire() + "'");
        }

        if (userRepository.existsByEmail(request.getEmailDestinataire())) {
            throw new BusinessException("L'email '" + request.getEmailDestinataire() + "' est déjà utilisé par un utilisateur existant");
        }

        String codeUnique;
        do {
            codeUnique = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (invitationRepository.existsByCodeUnique(codeUnique));

        Invitation invitation = Invitation.builder()
                .codeUnique(codeUnique)
                .emailDestinataire(request.getEmailDestinataire())
                .direction(auteur.getDirection())
                .emetteur(auteur)
                .statut(InvitationStatut.EN_ATTENTE)
                .dateExpiration(LocalDateTime.now().plusHours(48))
                .build();

        invitation = invitationRepository.save(invitation);

        String emetteurNom = auteur.getPrenom() + " " + auteur.getNom();
        emailService.envoyerEmailInvitation(
                request.getEmailDestinataire(), codeUnique, emetteurNom, auteur.getDirection().getNom());

        log.info("Invitation générée : {} → {} (code: {})", auteur.getEmail(), request.getEmailDestinataire(), codeUnique);
        return toResponseDTO(invitation);
    }

    @Transactional(readOnly = true)
    public Page<InvitationResponseDTO> listerInvitations(String search, String statut, User auteur, Pageable pageable) {
        InvitationStatut statutEnum = (statut == null || statut.isBlank()) ? null : InvitationStatut.valueOf(statut);
        return invitationRepository.searchByEmetteur(auteur.getId(), search, statutEnum, pageable).map(this::toResponseDTO);
    }

    @Transactional(readOnly = true)
    public InvitationResponseDTO getInvitationByCode(String code) {
        Invitation invitation = invitationRepository.findByCodeUnique(code)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation non trouvée avec le code : " + code));
        return toResponseDTO(invitation);
    }

    @Transactional
    public InvitationResponseDTO accepterInvitation(String code, AcceptInvitationRequestDTO request) {
        Invitation invitation = invitationRepository.findByCodeUnique(code)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation non trouvée avec le code : " + code));

        if (!InvitationStatut.EN_ATTENTE.equals(invitation.getStatut())) {
            throw new BusinessException("Cette invitation n'est plus valide (statut : " + invitation.getStatut() + ")");
        }

        if (invitation.getDirection() != null && "INACTIF".equals(invitation.getDirection().getStatut())) {
            throw new BusinessException("La direction associée à cette invitation est désactivée");
        }

        if (LocalDateTime.now().isAfter(invitation.getDateExpiration())) {
            invitation.setStatut(InvitationStatut.EXPIREE);
            invitationRepository.save(invitation);
            throw new BusinessException("Cette invitation a expiré le " + invitation.getDateExpiration());
        }

        if (userRepository.existsByEmail(invitation.getEmailDestinataire())) {
            throw new BusinessException("Un compte existe déjà pour l'email : " + invitation.getEmailDestinataire());
        }

        if (userRepository.existsByMatricule(request.getMatricule())) {
            throw new BusinessException("Le matricule '" + request.getMatricule() + "' est déjà utilisé");
        }

        List<String> postesDirection = posteRepository.findByDirectionIdOrderByNomAsc(invitation.getDirection().getId())
                .stream().map(poste -> poste.getNom().toLowerCase()).toList();
        if (!postesDirection.isEmpty() && !postesDirection.contains(request.getPoste().toLowerCase())) {
            throw new BusinessException("Le poste '" + request.getPoste() + "' n'appartient pas à la direction de l'invitation");
        }

        String email = invitation.getEmailDestinataire();
        keycloakService.creerUtilisateur(email, request.getNom(), request.getPrenom(), request.getMatricule(), "EMPLOYE");
        keycloakService.reinitialiserMotDePasse(email, request.getMotDePasse());

        User user = User.builder()
                .email(email)
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .matricule(request.getMatricule())
                .poste(request.getPoste())
                .role(UserRole.EMPLOYE)
                .statut(UserStatut.ACTIF)
                .direction(invitation.getDirection())
                .build();
        userRepository.save(user);

        invitation.setStatut(InvitationStatut.ACCEPTEE);
        invitation = invitationRepository.save(invitation);

        User emetteur = invitation.getEmetteur();
        notificationService.creerNotification(emetteur, TypeNotification.INVITATION_ACCEPTEE,
                "Votre invitation pour " + email + " a été acceptée. Le compte employé est créé.",
                "/employes-direction");

        log.info("Invitation acceptée : code {} par {} — compte créé", code, email);
        return toResponseDTO(invitation);
    }

    @Transactional
    public InvitationResponseDTO revoquerInvitation(Long id, User auteur) {
        Invitation invitation = invitationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation non trouvée avec l'id : " + id));

        if (!invitation.getEmetteur().getId().equals(auteur.getId())) {
            throw new BusinessException("Vous ne pouvez révoquer que vos propres invitations");
        }

        if (!InvitationStatut.EN_ATTENTE.equals(invitation.getStatut())) {
            throw new BusinessException("Cette invitation ne peut plus être révoquée (statut : " + invitation.getStatut() + ")");
        }

        invitation.setStatut(InvitationStatut.REVOQUEE);
        invitation = invitationRepository.save(invitation);

        log.info("Invitation révoquée : {} pour {}", id, invitation.getEmailDestinataire());
        return toResponseDTO(invitation);
    }

    @Scheduled(fixedDelay = 60000, initialDelay = 60000)
    @Transactional
    public void expirerInvitations() {
        List<Invitation> expirees = invitationRepository.findByStatutAndDateExpirationBefore(
                InvitationStatut.EN_ATTENTE, LocalDateTime.now());
        for (Invitation invitation : expirees) {
            invitation.setStatut(InvitationStatut.EXPIREE);
            invitationRepository.save(invitation);

            notificationService.creerNotification(invitation.getEmetteur(), TypeNotification.INVITATION_EXPIREE,
                    "Votre invitation pour " + invitation.getEmailDestinataire() + " a expiré. Pensez à relancer ou réinviter.",
                    "/invitations");
        }
        if (!expirees.isEmpty()) {
            log.info("{} invitation(s) expirée(s) automatiquement", expirees.size());
        }
    }

    private InvitationResponseDTO toResponseDTO(Invitation invitation) {
        Direction direction = invitation.getDirection();
        User emetteur = invitation.getEmetteur();

        return InvitationResponseDTO.builder()
                .id(invitation.getId())
                .codeUnique(invitation.getCodeUnique())
                .emailDestinataire(invitation.getEmailDestinataire())
                .directionId(direction != null ? direction.getId() : null)
                .directionNom(direction != null ? direction.getNom() : null)
                .postes(direction != null ? posteRepository.findByDirectionIdOrderByNomAsc(direction.getId())
                        .stream().map(Poste::getNom).toList() : null)
                .emetteurNom(emetteur != null ? emetteur.getPrenom() + " " + emetteur.getNom() : null)
                .emetteurEmail(emetteur != null ? emetteur.getEmail() : null)
                .statut(invitation.getStatut().name())
                .dateExpiration(invitation.getDateExpiration())
                .createdAt(invitation.getCreatedAt())
                .updatedAt(invitation.getUpdatedAt())
                .build();
    }
}
