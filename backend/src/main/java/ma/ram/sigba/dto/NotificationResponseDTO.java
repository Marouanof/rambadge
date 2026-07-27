package ma.ram.sigba.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponseDTO {

    private Long id;
    private String typeNotification;
    private String message;
    private Boolean lu;
    private String lienElement;
    private LocalDateTime createdAt;
}
