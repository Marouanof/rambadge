package ma.ram.sigba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ram.sigba.dto.ZoneResponseDTO;
import ma.ram.sigba.repository.ZoneRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ZoneService {

    private final ZoneRepository zoneRepository;

    public List<ZoneResponseDTO> listerZones() {
        return zoneRepository.findAllByOrderByNom().stream()
                .map(zone -> ZoneResponseDTO.builder()
                        .id(zone.getId())
                        .nom(zone.getNom())
                        .code(zone.getCode())
                        .description(zone.getDescription())
                        .build())
                .toList();
    }
}
