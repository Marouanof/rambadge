package ma.ram.sigba.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class RamEmailValidator implements ConstraintValidator<RamEmail, String> {

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String lower = email.toLowerCase();
        return lower.endsWith("@ram.ma") || lower.endsWith("@ram.com");
    }
}
