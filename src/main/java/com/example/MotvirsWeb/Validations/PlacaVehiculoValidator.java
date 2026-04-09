package com.example.MotvirsWeb.Validations;

import com.example.MotvirsWeb.Models.Vehiculo;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PlacaVehiculoValidator implements ConstraintValidator<ValidPlacaVehiculo, Vehiculo> {

    @Override
    public boolean isValid(Vehiculo vehiculo, ConstraintValidatorContext context) {
        if (vehiculo == null || vehiculo.getPlaca() == null || vehiculo.getTipoVehiculo() == null) {
            return false; // Forzamos que se definan
        }
        
        String placa = vehiculo.getPlaca().toUpperCase();
        
        switch (vehiculo.getTipoVehiculo()) {
            case MOTO:
                return placa.matches("^[A-Z]{3}[0-9]{2}[A-Z]$");
            case CARRO_PARTICULAR:
            case TAXI:
                return placa.matches("^[A-Z]{3}[0-9]{3}$");
            default:
                return false;
        }
    }
}
