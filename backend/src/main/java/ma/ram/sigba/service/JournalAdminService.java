package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.entity.JournalAdmin;
import ma.ram.sigba.repository.JournalAdminRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class JournalAdminService {

    private final JournalAdminRepository journalAdminRepository;

    public void journaliser(Long auteurId, String action, String cibleType, Long cibleId, String details) {
        JournalAdmin entry = JournalAdmin.builder()
                .auteurId(auteurId)
                .action(action)
                .cibleType(cibleType)
                .cibleId(cibleId)
                .details(details)
                .build();
        journalAdminRepository.save(entry);
        log.info("Action admin journalisée : {} sur {}#{} par utilisateur#{}", action, cibleType, cibleId, auteurId);
    }

    public List<JournalAdmin> getJournalParAuteur(Long auteurId) {
        return journalAdminRepository.findByAuteurIdOrderByHorodatageDesc(auteurId);
    }

    public List<JournalAdmin> getJournalParCible(String cibleType, Long cibleId) {
        return journalAdminRepository.findByCibleTypeAndCibleId(cibleType, cibleId);
    }
}
