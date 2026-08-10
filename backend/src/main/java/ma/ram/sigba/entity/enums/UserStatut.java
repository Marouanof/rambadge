package ma.ram.sigba.entity.enums;

public enum UserStatut {
    ACTIF,
    INACTIF,
    SUSPENDU;

    public static UserStatut parse(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
