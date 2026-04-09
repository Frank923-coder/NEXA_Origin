package com.example.MotvirsWeb.Models;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "Usuarios")
@TypeAlias("CONDUCTOR")
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder

public class Conductor extends Usuario{
    @NotBlank(message = "El nombre no puede estar en blanco")
    private String nombre_y_Apellido;

    @Indexed(unique = true, sparse = true)
    private String licenciaNumero;
    
    private String licenciaCategoria;
    private java.time.LocalDate licenciaVencimiento;
    private boolean antecedentesRechazados;

    @Field(name = "conductor_reset_password_token")
    @Indexed
    private String resetPasswordToken;

    @Field(name = "conductor_reset_password_token_expiry")
    @Indexed
    private LocalDateTime resetPasswordTokenExpiry;


    private List<ObjectId> vehiculos;


    public void agregarVehiculo(Vehiculo vehiculo) {
        if (this.vehiculos == null) {
            this.vehiculos = new ArrayList<>();
        }
        if (vehiculo != null && vehiculo.getId() != null) {
            this.vehiculos.add(new ObjectId(vehiculo.getId()));
        }
    }


    public Conductor() {
        this.setRol(Rol.CONDUCTOR);
        this.setEstadoValidacion(EstadoValidacion.PENDIENTE);
    }
}
