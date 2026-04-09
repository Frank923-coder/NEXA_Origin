package com.example.MotvirsWeb.Validations;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = PlacaVehiculoValidator.class)
// This will be used at the Class level because it needs both Placa and TipoVehiculo
@Target({ElementType.TYPE}) 
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPlacaVehiculo {
    String message() default "La placa no coincide con el formato exigido para el tipo de vehículo especificado.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
