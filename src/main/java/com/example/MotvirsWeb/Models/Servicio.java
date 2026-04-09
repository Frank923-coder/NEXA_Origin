package com.example.MotvirsWeb.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Document(collection = "servicios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Servicio {
    @Id
    private String id;

    // Datos del pasajero
    private PasajeroEmbedded pasajero;


    private ConductorEmbedded conductor;

    @DBRef
    private Vehiculo vehiculo;

    private String origen;
    private String destino;
    private double distanciaKM;
    private Coordenada ubicacionOrigen;
    private Coordenada ubicacionDestino;
    
    private int numeroPasajeros = 1;
    private Vehiculo.TipoVehiculo tipoVehiculoPedido;
    
    private LocalDateTime fechaHora;
    private LocalDateTime fechaAceptacion;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFinalizacion;
    private LocalDateTime fechaCancelacion;
    private double tarifa;
    private String metodoPago;
    private EstadoServicio estado;
    private Double calificacionConductor;
    private String comentariosConductor;
    private Double calificacionPasajero;
    private String comentariosPasajero;


    @Transient //  Le dice a Mongo que no guarde este campo
    public Double getCalificacionPromedio() {
        // Caso 1: Ambas calificaciones existen
        if (calificacionConductor != null && calificacionPasajero != null) {
            return (calificacionConductor + calificacionPasajero) / 2.0;
        }
        // Caso 2: Solo existe la del conductor
        if (calificacionConductor != null) {
            return calificacionConductor;
        }
        // Caso 3: Solo existe la del pasajero
        if (calificacionPasajero != null) {
            return calificacionPasajero;
        }
        // Caso 4: Ninguna existe
        return null;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Coordenada {
        private double latitud;
        private double longitud;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasajeroEmbedded {
        @Field("_id")
        private ObjectId id;  // Cambia de String a ObjectId
        private String nombre;
        private String email;


        public String getIdString() {
            return id != null ? id.toString() : null;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConductorEmbedded {
        @Field("_id")
        private ObjectId id;
        private String nombre;

        public String getIdString() {
            return id != null ? id.toString() : null;
        }

        public ConductorEmbedded(Conductor conductor) {
            if (conductor != null && conductor.getId() != null) {

                this.id = conductor.getId();
                this.nombre = conductor.getNombre_y_Apellido();

            } else {
                System.err.println("WARN: Se intentó crear ConductorEmbedded con Conductor nulo o sin ID.");

                this.id = null;
                this.nombre = "Desconocido";
            }
        }
    }


}