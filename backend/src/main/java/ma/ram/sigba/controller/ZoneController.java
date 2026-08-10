package ma.ram.sigba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.ram.sigba.dto.ApiResponse;
import ma.ram.sigba.dto.ZoneResponseDTO;
import ma.ram.sigba.service.ZoneService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
@RequiredArgsConstructor
@Tag(name = "Zones", description = "Référentiel des zones aéroportuaires")
public class ZoneController {

    private final ZoneService zoneService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EMPLOYE', 'MANAGER', 'AGENT_SURETE')")
    @Operation(summary = "Lister les zones disponibles", description = "Pistes, Tri Bagages, Zones réservées — utilisé pour la sélection à la soumission de la demande et lors des validations N1/N2.")
    public ResponseEntity<ApiResponse<List<ZoneResponseDTO>>> listerZones() {
        List<ZoneResponseDTO> zones = zoneService.listerZones();
        return ResponseEntity.ok(ApiResponse.ok(zones));
    }
}
