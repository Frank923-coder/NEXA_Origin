package com.example.MotvirsWeb.Validations;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = DocumentoIdentidadValidator.class)
@Target({ElementType.METHOD, ElementType.FIELD, ElementType.ANNOTATION_TYPE, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidDocumentoIdentidad {
    String message() default "El documento debe ser numérico y contener entre 3 y 10 dígitos.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
