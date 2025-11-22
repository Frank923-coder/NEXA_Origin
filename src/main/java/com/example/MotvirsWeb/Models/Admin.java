package com.example.MotvirsWeb.Models;

import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.security.crypto.password.PasswordEncoder;

@Document(collection = "Usuarios")
@TypeAlias("ADMIN")
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class Admin extends Usuario{
    public static final String DEFAULT_EMAIL = "admin@gmail.com";
    public static final String DEFAULT_PASSWORD = "admin123";

    @Builder.Default
    @Field("config_notificaciones")
    private boolean recibirNotificaciones = true;

    public Admin(PasswordEncoder passwordEncoder) {
        this.setEmail(DEFAULT_EMAIL);
        this.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
        this.setRol(Rol.ADMIN);
        this.setEstadoValidacion(EstadoValidacion.APROBADO);
        this.recibirNotificaciones =true;
    }


    public void aprobarConductor(Conductor conductor) {
        conductor.setEstadoValidacion(EstadoValidacion.APROBADO);
    }

    public void rechazarConductor(Conductor conductor) {
        conductor.setEstadoValidacion(EstadoValidacion.RECHAZADO);

    }
    public void pendienteConductor (Conductor conductor){
        conductor.setEstadoValidacion(EstadoValidacion.PENDIENTE);
    }
}
