package com.example.MotvirsWeb.Service;

import com.example.MotvirsWeb.Models.Conductor;
import com.example.MotvirsWeb.Models.Pasajero;
import com.example.MotvirsWeb.Models.Servicio;

import java.util.List;
import java.util.Map;

/**
 * Contrato de servicio para todas las operaciones de negocio sobre
 * {@link Servicio}.
 *
 * Principio DIP: los Controllers dependen de esta interfaz, no de clases
 * concretas ni
 * de repositorios. Principio SRP: toda la lógica de negocio de servicios vive
 * en la
 * implementación, liberando a los controllers de esa responsabilidad.
 */
public interface ServicioService {

    // ── Operaciones del Conductor ─────────────────────────────────────

    /**
     * Acepta un servicio SOLICITADO y lo asigna al conductor dado.
     * 
     * @return mapa con mensaje y servicioId
     */
    Map<String, Object> aceptarServicio(String servicioId, Conductor conductor);

    /**
     * Cambia el estado de un servicio ACEPTADO a EN_CURSO.
     */
    Map<String, Object> iniciarServicio(String servicioId, Conductor conductor);

    /**
     * Finaliza un servicio EN_CURSO del conductor dado.
     */
    Map<String, Object> finalizarServicio(String servicioId, Conductor conductor);

    /**
     * Cancela un servicio activo del conductor dado.
     */
    Map<String, Object> cancelarServicioConductor(String servicioId, Conductor conductor);

    /**
     * Retorna servicios disponibles (estado SOLICITADO).
     */
    List<Servicio> obtenerServiciosDisponibles();

    /**
     * Retorna servicios EN_CURSO del conductor.
     */
    List<Servicio> obtenerServiciosEnCurso(Conductor conductor);

    /**
     * Retorna un servicio por su ID (acceso genérico para el conductor).
     */
    Servicio obtenerServicioPorId(String servicioId);

    /**
     * Retorna el historial FINALIZADO del conductor, con filtros opcionales.
     */
    List<Servicio> obtenerHistorialConductor(Conductor conductor, String fecha, String pasajero);

    /**
     * Retorna ingresos del conductor, filtrados por periodo y/o fecha exacta.
     */
    List<Map<String, Object>> obtenerIngresosConductor(Conductor conductor, String periodo, String fecha);

    // ── Operaciones del Pasajero ──────────────────────────────────────

    /**
     * Crea y persiste un nuevo servicio a partir de los datos de la solicitud.
     * 
     * @return mapa con mensaje y servicioId
     */
    Map<String, Object> solicitarViaje(Map<String, Object> solicitud, Pasajero pasajero);

    /**
     * El pasajero cancela su viaje (solo si está SOLICITADO o ACEPTADO).
     */
    Map<String, Object> cancelarViajePasajero(String servicioId, Pasajero pasajero);

    /**
     * Retorna el historial FINALIZADO del pasajero, con filtros opcionales.
     */
    List<Servicio> obtenerHistorialPasajero(Pasajero pasajero, String fecha, String conductor);

    /**
     * Retorna un servicio verificando que pertenece al pasajero dado.
     */
    Servicio obtenerServicioDePasajero(String servicioId, Pasajero pasajero);

    // ── Calificación (usada por ControllerRating y ControllerPasajero) ──

    /**
     * Registra la calificación de un participante sobre el otro.
     * 
     * @param rol "conductor" o "pasajero"
     */
    Map<String, Object> calificarServicio(String servicioId, String rol,
            Double calificacion, String comentarios);
}
