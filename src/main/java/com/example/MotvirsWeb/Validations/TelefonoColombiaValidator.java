package com.example.MotvirsWeb.Validations;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;
import com.google.i18n.phonenumbers.NumberParseException;

public class TelefonoColombiaValidator implements ConstraintValidator<ValidTelefonoColombia, String> {

    @Override
    public boolean isValid(String s, ConstraintValidatorContext context) {
        if (s == null || s.trim().isEmpty()) {
            return false;
        }
        PhoneNumberUtil phoneUtil = PhoneNumberUtil.getInstance();
        try {
            PhoneNumber number = phoneUtil.parse(s, "CO");
            return phoneUtil.isValidNumber(number);
        } catch (NumberParseException e) {
            return false;
        }
    }
}
