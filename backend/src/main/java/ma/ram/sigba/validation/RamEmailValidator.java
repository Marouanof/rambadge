package ma.ram.sigba.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class RamEmailValidator implements ConstraintValidator<RamEmail, String> {

    private static final String RAM_DOMAIN = "@ram.com";

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return email.toLowerCase().endsWith(RAM_DOMAIN);
    }
}
