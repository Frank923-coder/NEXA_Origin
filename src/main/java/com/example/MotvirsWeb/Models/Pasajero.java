package com.example.MotvirsWeb.Models;

import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;

@Document(collection = "Usuarios")
@Data
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@TypeAlias("PASAJERO")
public class Pasajero extends Usuario{
    
    @NotBlank(message = "El nombre no puede estar en blanco")
    private String nombreCompleto;

    public Pasajero() {
        this.setRol(Rol.PASAJERO);
    }
}
