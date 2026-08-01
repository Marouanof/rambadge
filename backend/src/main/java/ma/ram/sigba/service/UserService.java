package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.UpdateProfileRequestDTO;
import ma.ram.sigba.dto.UserResponseDTO;
import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.enums.UserStatut;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
                .poste(user.getPoste())
                .role(user.getRole().name())
                .statut(user.getStatut().name())
                .directionNom(user.getDirection() != null ? user.getDirection().getNom() : null)
                .build();
    }

    public UserResponseDTO updateProfile(UpdateProfileRequestDTO request) {
        User user = getCurrentUser();
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setPoste(request.getPoste());
        userRepository.save(user);
        log.info("Profil mis à jour pour {}", user.getEmail());
        return UserResponseDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .matricule(user.getMatricule())
                .poste(user.getPoste())
                .role(user.getRole().name())
                .statut(user.getStatut().name())
                .directionNom(user.getDirection() != null ? user.getDirection().getNom() : null)
                .build();
    }

    public Page<UserResponseDTO> listerEmployes(String search, String statut, Pageable pageable) {
        Page<User> employes;
        if (statut != null && !statut.isBlank()) {
            UserStatut userStatut = UserStatut.valueOf(statut.toUpperCase());
            employes = userRepository.searchEmployesByStatut(search != null ? search : "", userStatut, pageable);
        } else {
            employes = userRepository.searchEmployes(search != null ? search : "", pageable);
        }
        return employes.map(this::toResponseDTO);
    }

    public UserResponseDTO getEmployeById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employé non trouvé avec l'id : " + id));
        return toResponseDTO(user);
    }

    private UserResponseDTO toResponseDTO(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .matricule(user.getMatricule())
                .poste(user.getPoste())
                .role(user.getRole().name())
                .statut(user.getStatut().name())
                .directionNom(user.getDirection() != null ? user.getDirection().getNom() : null)
                .build();
    }
}
