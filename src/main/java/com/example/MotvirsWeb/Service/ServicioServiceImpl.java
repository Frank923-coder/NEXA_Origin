package com.example.MotvirsWeb.Service;

import com.example.MotvirsWeb.Models.*;
import com.example.MotvirsWeb.Repositorios.ServicioRepository;
import com.example.MotvirsWeb.Security.IllegalStateTransitionException;
import com.example.MotvirsWeb.Repositorios.VehiculoRepository;
import com.example.MotvirsWeb.socket.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementación de {@link ServicioService}.
 *
 * Centraliza toda la lógica de negocio relacionada con el ciclo de vida de un
 * Servicio:
 * solicitud, aceptación, inicio, finalización, cancelación y calificación.
 *
 * Principios aplicados:
 * - SRP: un único lugar para las reglas de negocio de Servicio.
 * - DIP: los Controllers dependen de la interfaz, no de esta clase
 * directamente.
 * - OCP: agregar nuevos periodos de filtro de ingresos no requiere modificar
 * controllers.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ServicioServiceImpl implements ServicioService {

    private final ServicioRepository servicioRepository;
    private final VehiculoRepository vehiculoRepository;
    private final WebSocketService webSocketService;
    private final ServicioStateMachine stateMachine;

    // ─────────────────────────── CONDUCTOR ───────────────────────────

    @Override
    public Map<String, Object> aceptarServicio(String servicioId, Conductor conductor) {
        Servicio servicio = buscarServicio(servicioId);

        // --- Validaciones Legales de Conductor/Vehículo ---
        if (conductor.getVehiculos() == null || conductor.getVehiculos().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El conductor no tiene vehículos asignados.");
        }
        
        Vehiculo vehiculo = vehiculoRepository.findById(conductor.getVehiculos().get(0).toString())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vehículo no existe"));
            
        if (vehiculo.getSoatVencimiento() != null) {
            long daysToSoatExpiry = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), vehiculo.getSoatVencimiento());
            if (daysToSoatExpiry <= 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tu SOAT está vencido o vence en menos de 24 horas. No puedes aceptar servicios.");
            }
        }
        
        if (vehiculo.getRtmVencimiento() != null) {
             long daysToRtmExpiry = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), vehiculo.getRtmVencimiento());
             if (daysToRtmExpiry <= 1) {
                 throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tu RTM está vencida o vence en menos de 24 horas. No puedes aceptar servicios.");
             }
        }

        try {
            stateMachine.transition(servicio.getEstado(), EstadoServicio.ACEPTADO);
        } catch (IllegalStateTransitionException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }

        servicio.setConductor(new Servicio.ConductorEmbedded(conductor));
        servicio.setEstado(EstadoServicio.ACEPTADO);
        servicio.setFechaAceptacion(LocalDateTime.now());
        servicioRepository.save(servicio);
        webSocketService.notificarCambioEstadoServicio(servicio);

        return Map.of("mensaje", "Servicio aceptado con éxito", "servicioId", servicioId);
    }

    @Override
    public Map<String, Object> iniciarServicio(String servicioId, Conductor conductor) {
        Servicio servicio = buscarServicio(servicioId);

        try {
            stateMachine.transition(servicio.getEstado(), EstadoServicio.EN_CURSO);
        } catch (IllegalStateTransitionException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }

        servicio.setEstado(EstadoServicio.EN_CURSO);
        servicio.setFechaInicio(LocalDateTime.now());
        servicioRepository.save(servicio);
        webSocketService.notificarCambioEstadoServicio(servicio);

        return Map.of("mensaje", "Viaje iniciado con éxito", "servicioId", servicioId);
    }

    @Override
    public Map<String, Object> finalizarServicio(String servicioId, Conductor conductor) {
        Servicio servicio = buscarServicio(servicioId);

        if (!servicio.getConductor().getId().equals(conductor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No puedes finalizar un servicio que no te pertenece");
        }

        try {
            stateMachine.transition(servicio.getEstado(), EstadoServicio.FINALIZADO);
        } catch (IllegalStateTransitionException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }

        servicio.setEstado(EstadoServicio.FINALIZADO);
        servicio.setFechaFinalizacion(LocalDateTime.now());
        servicioRepository.save(servicio);
        webSocketService.notificarCambioEstadoServicio(servicio);

        return Map.of(
                "mensaje", "Servicio finalizado con éxito. Redirigiendo a calificación...",
                "servicioId", servicioId,
                "redirectUrl", "/rating?servicioId=" + servicioId + "&rol=conductor");
    }

    @Override
    public Map<String, Object> cancelarServicioConductor(String servicioId, Conductor conductor) {
        Servicio servicio = buscarServicio(servicioId);

        if (!servicio.getConductor().getId().equals(conductor.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No puedes cancelar este servicio");
        }

        try {
            stateMachine.transition(servicio.getEstado(), EstadoServicio.CANCELADO);
        } catch (IllegalStateTransitionException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }

        servicio.setEstado(EstadoServicio.CANCELADO);
        servicio.setFechaCancelacion(LocalDateTime.now());
        servicioRepository.save(servicio);
        webSocketService.notificarCambioEstadoServicio(servicio);

        return Map.of("mensaje", "Servicio cancelado con éxito", "servicioId", servicioId);
    }

    @Override
    public List<Servicio> obtenerServiciosDisponibles() {
        return servicioRepository.findByEstado(EstadoServicio.SOLICITADO);
    }

    @Override
    public List<Servicio> obtenerServiciosEnCurso(Conductor conductor) {
        return servicioRepository.findByConductorIdAndEstado(
                conductor.getId(), EstadoServicio.EN_CURSO);
    }

    @Override
    public Servicio obtenerServicioPorId(String servicioId) {
        return buscarServicio(servicioId);
    }

    @Override
    public List<Servicio> obtenerHistorialConductor(Conductor conductor,
            String fecha, String pasajero) {
        List<Servicio> historial = servicioRepository.findByConductorIdAndEstado(
                conductor.getId(), EstadoServicio.FINALIZADO);

        if (fecha != null || pasajero != null) {
            historial = historial.stream()
                    .filter(s -> {
                        boolean matchFecha = fecha == null ||
                                s.getFechaHora().toLocalDate().toString().equals(fecha);
                        boolean matchPasajero = pasajero == null ||
                                s.getPasajero().getNombre().toLowerCase()
                                        .contains(pasajero.toLowerCase());
                        return matchFecha && matchPasajero;
                    })
                    .collect(Collectors.toList());
        }
        return historial;
    }

    @Override
    public List<Map<String, Object>> obtenerIngresosConductor(Conductor conductor,
            String periodo, String fecha) {
        List<Servicio> servicios = servicioRepository.findByConductorIdAndEstado(
                conductor.getId(), EstadoServicio.FINALIZADO);

        List<Servicio> filtrados = filtrarPorPeriodo(servicios, periodo, fecha);

        return filtrados.stream()
                .map(s -> {
                    Map<String, Object> ingreso = new HashMap<>();
                    ingreso.put("fecha", s.getFechaHora().toLocalDate().toString());
                    ingreso.put("monto", s.getTarifa());
                    ingreso.put("descripcion", "Viaje con " + s.getPasajero().getNombre());
                    return ingreso;
                })
                .collect(Collectors.toList());
    }

    // ─────────────────────────── PASAJERO ────────────────────────────

    @Override
    public Map<String, Object> solicitarViaje(Map<String, Object> solicitud, Pasajero pasajero) {
        validarCamposRequeridos(solicitud);

        Servicio servicio = new Servicio();
        servicio.setPasajero(new Servicio.PasajeroEmbedded(
                pasajero.getId(),
                pasajero.getNombreCompleto(),
                pasajero.getEmail()));

        servicio.setOrigen((String) solicitud.get("origen"));
        servicio.setDestino((String) solicitud.get("destino"));

        @SuppressWarnings("unchecked")
        Map<String, Object> ubicacionOrigen = (Map<String, Object>) solicitud.get("ubicacionOrigen");
        servicio.setUbicacionOrigen(new Servicio.Coordenada(
                parseDoble(ubicacionOrigen.get("latitud")),
                parseDoble(ubicacionOrigen.get("longitud"))));

        @SuppressWarnings("unchecked")
        Map<String, Object> ubicacionDestino = (Map<String, Object>) solicitud.get("ubicacionDestino");
        servicio.setUbicacionDestino(new Servicio.Coordenada(
                parseDoble(ubicacionDestino.get("latitud")),
                parseDoble(ubicacionDestino.get("longitud"))));

        // -- Validaciones de Pasajeros y Vehículo --
        int pasajerosSol = solicitud.containsKey("numeroPasajeros") ? 
            ((Number) solicitud.get("numeroPasajeros")).intValue() : 1;
        
        String tipoPedidoStr = (String) solicitud.getOrDefault("tipoVehiculoPedido", "CARRO_PARTICULAR");
        Vehiculo.TipoVehiculo tipoPedido;
        try {
            tipoPedido = Vehiculo.TipoVehiculo.valueOf(tipoPedidoStr.toUpperCase());
        } catch(IllegalArgumentException e) {
            tipoPedido = Vehiculo.TipoVehiculo.CARRO_PARTICULAR;
        }

        if (tipoPedido == Vehiculo.TipoVehiculo.MOTO && pasajerosSol > 1) {
             throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las motos no pueden llevar más de 1 pasajero.");
        }
        if (pasajerosSol > 4) {
             throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pueden llevar más de 4 pasajeros.");
        }

        servicio.setNumeroPasajeros(pasajerosSol);
        servicio.setTipoVehiculoPedido(tipoPedido);

        double tarifa = parseDoble(solicitud.get("tarifa"));
        if (tarifa <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La tarifa debe ser mayor a 0");
        }
        servicio.setTarifa(tarifa);

        double distancia = parseDoble(solicitud.get("distanciaKM"));
        if (distancia <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La distancia debe ser mayor a 0");
        }
        servicio.setDistanciaKM(distancia);

        String fechaHoraStr = (String) solicitud.get("fechaHora");
        servicio.setFechaHora(fechaHoraStr != null
                ? LocalDateTime.parse(fechaHoraStr, DateTimeFormatter.ISO_DATE_TIME)
                : LocalDateTime.now());

        if (solicitud.containsKey("metodoPago")) {
            servicio.setMetodoPago((String) solicitud.get("metodoPago"));
        }

        servicio.setEstado(EstadoServicio.SOLICITADO);
        servicio = servicioRepository.save(servicio);
        webSocketService.notificarNuevoServicioDisponible(servicio);

        return Map.of(
                "mensaje", "Viaje solicitado con éxito. Esperando conductor...",
                "servicioId", servicio.getId() != null ? servicio.getId() : "null-id");
    }

    @Override
    public Map<String, Object> cancelarViajePasajero(String servicioId, Pasajero pasajero) {
        Servicio servicio = buscarServicio(servicioId);

        if (servicio.getPasajero() == null || servicio.getPasajero().getId() == null ||
                !servicio.getPasajero().getId().equals(pasajero.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No tienes permiso para cancelar este servicio");
        }

        try {
            stateMachine.transition(servicio.getEstado(), EstadoServicio.CANCELADO);
        } catch (IllegalStateTransitionException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }

        servicio.setEstado(EstadoServicio.CANCELADO);
        servicio.setFechaCancelacion(LocalDateTime.now());
        Servicio cancelado = servicioRepository.save(servicio);
        webSocketService.notificarCambioEstadoServicio(cancelado);

        return Map.of("mensaje", "Viaje cancelado con éxito", "servicioId", servicioId);
    }

    @Override
    public List<Servicio> obtenerHistorialPasajero(Pasajero pasajero,
            String fecha, String conductor) {
        List<Servicio> historial = servicioRepository.findByPasajeroIdAndEstado(
                pasajero.getId(), EstadoServicio.FINALIZADO);

        if (fecha != null || conductor != null) {
            historial = historial.stream()
                    .filter(s -> {
                        boolean matchFecha = fecha == null ||
                                s.getFechaHora().toLocalDate().toString().equals(fecha);
                        boolean matchConductor = conductor == null || conductor.isEmpty() ||
                                (s.getConductor() != null &&
                                        s.getConductor().getNombre() != null &&
                                        s.getConductor().getNombre().toLowerCase()
                                                .contains(conductor.toLowerCase()));
                        return matchFecha && matchConductor;
                    })
                    .collect(Collectors.toList());
        }
        return historial;
    }

    @Override
    public Servicio obtenerServicioDePasajero(String servicioId, Pasajero pasajero) {
        Servicio servicio = buscarServicio(servicioId);
        if (!servicio.getPasajero().getId().equals(pasajero.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No tienes permiso para ver este servicio");
        }
        return servicio;
    }

    // ───────────────────────── CALIFICACIÓN ──────────────────────────

    @Override
    public Map<String, Object> calificarServicio(String servicioId, String rol,
            Double calificacion, String comentarios) {
        Servicio servicio = buscarServicio(servicioId);

        if ("pasajero".equals(rol)) {
            servicio.setCalificacionConductor(calificacion);
            servicio.setComentariosConductor(comentarios);
        } else if ("conductor".equals(rol)) {
            servicio.setCalificacionPasajero(calificacion);
            servicio.setComentariosPasajero(comentarios);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Rol inválido: " + rol);
        }

        servicio.setEstado(EstadoServicio.FINALIZADO);
        servicioRepository.save(servicio);

        return Map.of("mensaje", "Calificación enviada con éxito", "servicioId", servicioId);
    }

    // ─────────────────────── MÉTODOS PRIVADOS ────────────────────────

    /**
     * Busca un servicio por ID o lanza 404.
     */
    private Servicio buscarServicio(String servicioId) {
        return servicioRepository.findById(servicioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Servicio no encontrado: " + servicioId));
    }

    /**
     * Filtra una lista de servicios por periodo o fecha exacta.
     * Principio OCP: agregar un nuevo periodo solo requiere añadir un case aquí.
     */
    private List<Servicio> filtrarPorPeriodo(List<Servicio> servicios,
            String periodo, String fecha) {
        if (servicios == null || servicios.isEmpty()) {
            return servicios;
        }

        LocalDate today = LocalDate.now();

        if (fecha != null) {
            return servicios.stream()
                    .filter(s -> s.getFechaHora().toLocalDate().toString().equals(fecha))
                    .collect(Collectors.toList());
        }

        if (periodo == null) {
            return servicios;
        }

        return switch (periodo) {
            case "año" -> servicios.stream()
                    .filter(s -> s.getFechaHora().getYear() == today.getYear())
                    .collect(Collectors.toList());
            case "mes" -> servicios.stream()
                    .filter(s -> s.getFechaHora().getYear() == today.getYear() &&
                            s.getFechaHora().getMonth() == today.getMonth())
                    .collect(Collectors.toList());
            case "semana" -> {
                LocalDate startOfWeek = today.with(
                        TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                LocalDate endOfWeek = startOfWeek.plusDays(6);
                yield servicios.stream()
                        .filter(s -> {
                            LocalDate d = s.getFechaHora().toLocalDate();
                            return !d.isBefore(startOfWeek) && !d.isAfter(endOfWeek);
                        })
                        .collect(Collectors.toList());
            }
            case "día" -> servicios.stream()
                    .filter(s -> s.getFechaHora().toLocalDate().equals(today))
                    .collect(Collectors.toList());
            default -> servicios;
        };
    }

    /**
     * Valida que el mapa de solicitud de viaje contenga todos los campos
     * requeridos.
     */
    private void validarCamposRequeridos(Map<String, Object> solicitud) {
        List<String> camposRequeridos = List.of(
                "origen", "destino", "ubicacionOrigen", "ubicacionDestino",
                "tarifa", "distanciaKM");
        for (String campo : camposRequeridos) {
            if (!solicitud.containsKey(campo)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Falta campo requerido en la solicitud: " + campo);
            }
        }
    }

    /**
     * Convierte un Object a double de forma segura.
     */
    private double parseDoble(Object valor) {
        return valor instanceof Number ? ((Number) valor).doubleValue() : 0.0;
    }
}
