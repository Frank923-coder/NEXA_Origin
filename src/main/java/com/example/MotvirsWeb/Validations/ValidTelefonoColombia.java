package com.example.MotvirsWeb.Validations;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = TelefonoColombiaValidator.class)
@Target({ElementType.METHOD, ElementType.FIELD, ElementType.ANNOTATION_TYPE, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidTelefonoColombia {
    String message() default "El teléfono debe corresponder a Colombia (+57 seguido de 3 y 9 dígitos adicionales, total 10 dígitos numéricos).";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
