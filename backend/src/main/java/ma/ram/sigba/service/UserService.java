package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.UserResponseDTO;
import ma.ram.sigba.entity.User;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) {
            throw new ResourceNotFoundException("Aucun utilisateur authentifié");
        }
        String email = jwt.getClaimAsString("email");
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'email : " + email));
    }

    public UserResponseDTO getCurrentUserProfile() {
        User user = getCurrentUser();
        return UserResponseDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .matricule(user.getMatricule())
                .role(user.getRole().name())
                .statut(user.getStatut().name())
                .directionNom(user.getDirection() != null ? user.getDirection().getNom() : null)
                .build();
    }
}
