package ma.ram.sigba.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeycloakRoleDTO {

    private String id;
    private String name;
    private String description;
    private Boolean composite;
}
