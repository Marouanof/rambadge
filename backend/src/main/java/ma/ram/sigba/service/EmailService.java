package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.util.SecureTokenUtil;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Async("emailExecutor")
    public void envoyerEmailInvitation(String destinataire, String codeUnique, String emetteurNom, String directionNom) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@sigba.ma");
        message.setTo(destinataire);
        message.setSubject("Invitation SIGBA - Créez votre compte");
        message.setText(
                "Bonjour,\n\n"
                + emetteurNom + " vous a invité à rejoindre le système SIGBA (Direction " + directionNom + ").\n\n"
                + "Pour créer votre compte, cliquez sur le lien ci-dessous :\n\n"
                + "http://localhost:5173/inscription?code=" + codeUnique + "\n\n"
                + "Ce lien expire dans 48 heures.\n\n"
                + "Cordialement,\nL'équipe SIGBA"
        );

        try {
            javaMailSender.send(message);
            log.info("Email d'invitation envoyé à {} (code: {})", destinataire, codeUnique);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email d'invitation à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async("emailExecutor")
    public void envoyerEmailActivationAgent(String destinataire, String prenom, String nom) {
        String token = SecureTokenUtil.generateToken(destinataire);
        String lien = "http://localhost:5173/set-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@sigba.ma");
        message.setTo(destinataire);
        message.setSubject("SIGBA - Définissez votre mot de passe");
        message.setText(
                "Bonjour " + prenom + " " + nom + ",\n\n"
                + "Un compte SIGBA a été créé pour vous.\n\n"
                + "Pour définir votre mot de passe, cliquez sur le lien ci-dessous :\n\n"
                + lien + "\n\n"
                + "Ce lien expire dans 24 heures.\n\n"
                + "Cordialement,\nL'équipe SIGBA"
        );

        try {
            javaMailSender.send(message);
            log.info("Email d'activation agent envoyé à {}", destinataire);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email d'activation à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async("emailExecutor")
    public void envoyerEmailReinitialisationMotDePasse(String destinataire) {
        String token = SecureTokenUtil.generateToken(destinataire);
        String lien = "http://localhost:5173/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@sigba.ma");
        message.setTo(destinataire);
        message.setSubject("SIGBA - Réinitialisation de votre mot de passe");
        message.setText(
                "Bonjour,\n\n"
                + "Une demande de réinitialisation de mot de passe a été effectuée pour votre compte SIGBA.\n\n"
                + "Pour réinitialiser votre mot de passe, cliquez sur le lien ci-dessous :\n\n"
                + lien + "\n\n"
                + "Ce lien expire dans 24 heures.\n\n"
                + "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\n"
                + "Cordialement,\nL'équipe SIGBA"
        );

        try {
            javaMailSender.send(message);
            log.info("Email de réinitialisation envoyé à {}", destinataire);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de réinitialisation à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async("emailExecutor")
    public void envoyerEmailActivation(String destinataire, String prenom, String nom) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@sigba.ma");
        message.setTo(destinataire);
        message.setSubject("SIGBA - Activez votre compte");
        message.setText(
                "Bonjour " + prenom + " " + nom + ",\n\n"
                + "Un compte SIGBA a été créé pour vous.\n\n"
                + "Pour activer votre compte et définir votre mot de passe, connectez-vous à :\n\n"
                + "http://localhost:5173/login\n\n"
                + "Utilisez votre adresse email (" + destinataire + ") pour vous connecter.\n\n"
                + "Si vous rencontrez des problèmes, contactez l'administrateur.\n\n"
                + "Cordialement,\nL'équipe SIGBA"
        );

        try {
            javaMailSender.send(message);
            log.info("Email d'activation envoyé à {}", destinataire);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email d'activation à {} : {}", destinataire, e.getMessage());
        }
    }
}
