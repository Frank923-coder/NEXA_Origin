package com.example.MotvirsWeb.Models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDate;
import com.example.MotvirsWeb.Validations.ValidPlacaVehiculo;

@Document(collection = "Vehiculos")
@ValidPlacaVehiculo
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehiculo {
    @Id
    private String id;

    private ConductorEmbedded conductor;

    @Indexed(unique = true)
    private String placa; // Número de placa único

    private String marca;
    private String modelo;
    private String color;
    
    private int anioFabricacion;
    private int cilindraje; 

    public enum TipoVehiculo { MOTO, CARRO_PARTICULAR, TAXI }
    private TipoVehiculo tipoVehiculo;

    @Indexed(unique = true, sparse = true)
    private String soatNumero;
    private LocalDate soatVencimiento;
    
    private String tecnomecanicaId;
    private LocalDate rtmVencimiento;

    @DBRef
    private Conductor conductorAsignado; // Referencia al conductor propietario

    private boolean activo = true;
    private LocalDate fechaRegistro;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConductorEmbedded {
        @Field("_id")
        private ObjectId id;  // Cambia de String a ObjectId
        private String nombre;
        private String email;

        // Método para obtener el id como String si lo necesitas
        public String getIdString() {
            return id != null ? id.toString() : null;
        }
    }

}
