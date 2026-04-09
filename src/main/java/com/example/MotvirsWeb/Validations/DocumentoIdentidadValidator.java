package com.example.MotvirsWeb.Validations;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class DocumentoIdentidadValidator implements ConstraintValidator<ValidDocumentoIdentidad, String> {

    @Override
    public boolean isValid(String s, ConstraintValidatorContext context) {
        if (s == null || s.trim().isEmpty()) {
            return false; // Not allowing empty docs here
        }
        return s.matches("^[0-9]{3,10}$");
    }
}
