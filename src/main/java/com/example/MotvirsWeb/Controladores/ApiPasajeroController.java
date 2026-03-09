package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.Pasajero;
import com.example.MotvirsWeb.Models.Servicio;
import com.example.MotvirsWeb.Service.ServicioService;
import com.example.MotvirsWeb.util.UsuarioContextHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * REST Controller para el Pasajero (Mobile API).
 * 
 * Sigue el principio SOLID de Responsabilidad Única (SRP):
 * Solo maneja la capa de transporte REST y delega la lógica a ServicioService.
 */
@RestController
@RequestMapping("/api/pasajero")
@RequiredArgsConstructor
public class ApiPasajeroController {

    private final ServicioService servicioService;
    private final UsuarioContextHelper usuarioContext;

    @GetMapping("/perfil")
    public ResponseEntity<Pasajero> obtenerPerfil() {
        return ResponseEntity.ok(usuarioContext.getPasajeroAutenticado());
    }

    @PostMapping("/solicitar-viaje")
    public ResponseEntity<?> solicitarViaje(@RequestBody Map<String, Object> solicitud) {
        try {
            Pasajero pasajero = usuarioContext.getPasajeroAutenticado();
            return ResponseEntity.ok(servicioService.solicitarViaje(solicitud, pasajero));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/cancelar-viaje/{servicioId}")
    public ResponseEntity<?> cancelarViaje(@PathVariable String servicioId) {
        try {
            Pasajero pasajero = usuarioContext.getPasajeroAutenticado();
            return ResponseEntity.ok(servicioService.cancelarViajePasajero(servicioId, pasajero));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/historial")
    public ResponseEntity<List<Servicio>> obtenerHistorial(
            @RequestParam(required = false) String fecha,
            @RequestParam(required = false) String conductor) {
        Pasajero pasajero = usuarioContext.getPasajeroAutenticado();
        return ResponseEntity.ok(servicioService.obtenerHistorialPasajero(pasajero, fecha, conductor));
    }

    @GetMapping("/servicios/{servicioId}")
    public ResponseEntity<?> obtenerDetalleServicio(@PathVariable String servicioId) {
        try {
            Pasajero pasajero = usuarioContext.getPasajeroAutenticado();
            return ResponseEntity.ok(servicioService.obtenerServicioDePasajero(servicioId, pasajero));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/calificar-servicio/{servicioId}")
    public ResponseEntity<?> calificarServicio(@PathVariable String servicioId,
            @RequestBody Map<String, Object> datos) {
        try {
            Double calificacion = Double.parseDouble(datos.get("calificacion").toString());
            String comentarios = datos.getOrDefault("comentarios", "").toString();
            return ResponseEntity.ok(
                    servicioService.calificarServicio(servicioId, "pasajero", calificacion, comentarios));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
