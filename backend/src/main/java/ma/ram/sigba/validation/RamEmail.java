package ma.ram.sigba.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = RamEmailValidator.class)
@Documented
public @interface RamEmail {
    String message() default "L'email doit être une adresse professionnelle RAM (@ram.com)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
