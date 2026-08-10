package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.UpdateProfileRequestDTO;
import ma.ram.sigba.dto.UserPreferencesDTO;
import ma.ram.sigba.dto.UserResponseDTO;
import ma.ram.sigba.entity.User;
import ma.ram.sigba.entity.UserPreferences;
import ma.ram.sigba.entity.enums.ThemePreference;
import ma.ram.sigba.entity.enums.UserStatut;
import ma.ram.sigba.exception.BusinessException;
import ma.ram.sigba.exception.ResourceNotFoundException;
import ma.ram.sigba.repository.UserPreferencesRepository;
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
    private final UserPreferencesRepository userPreferencesRepository;

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
        return toResponseDTO(getCurrentUser());
    }

    public UserResponseDTO updateProfile(UpdateProfileRequestDTO request) {
        User user = getCurrentUser();
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setPoste(request.getPoste());
        if (request.getPhotoUrl() != null) {
            user.setPhotoUrl(request.getPhotoUrl());
        }
        userRepository.save(user);
        log.info("Profil mis à jour pour {}", user.getEmail());
        return toResponseDTO(user);
    }

    public UserPreferencesDTO getPreferences() {
        UserPreferences prefs = getPreferencesEntity();
        return toPreferencesDTO(prefs);
    }

    public UserPreferencesDTO updatePreferences(UserPreferencesDTO request) {
        ThemePreference theme;
        try {
            theme = ThemePreference.valueOf(request.getTheme());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Thème invalide");
        }
        UserPreferences prefs = getPreferencesEntity();
        prefs.setTheme(theme);
        userPreferencesRepository.save(prefs);
        log.info("Préférences mises à jour pour {}", getCurrentUser().getEmail());
        return toPreferencesDTO(prefs);
    }

    private UserPreferences getPreferencesEntity() {
        User user = getCurrentUser();
        return userPreferencesRepository.findByUserId(user.getId())
                .orElseGet(() -> userPreferencesRepository.save(
                        UserPreferences.builder().user(user).build()));
    }

    private UserPreferencesDTO toPreferencesDTO(UserPreferences prefs) {
        return UserPreferencesDTO.builder()
                .theme(prefs.getTheme().name())
                .build();
    }

    public Page<UserResponseDTO> listerEmployes(String search, String statut, Pageable pageable) {
        Page<User> employes;
        if (statut != null && !statut.isBlank()) {
            UserStatut userStatut = UserStatut.parse(statut);
            if (userStatut != null) {
                employes = userRepository.searchEmployesByStatut(search != null ? search : "", userStatut, pageable);
            } else {
                employes = userRepository.searchEmployes(search != null ? search : "", pageable);
            }
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
                .photoUrl(user.getPhotoUrl())
                .role(user.getRole().name())
                .statut(user.getStatut().name())
                .directionNom(user.getDirection() != null ? user.getDirection().getNom() : null)
                .build();
    }
}
