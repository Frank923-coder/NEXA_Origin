package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.Pasajero;
import com.example.MotvirsWeb.Models.Servicio;
import com.example.MotvirsWeb.Service.ServicioService;
import com.example.MotvirsWeb.util.UsuarioContextHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * Controller HTTP para el Pasajero.
 *
 * Responsabilidad única: mapear rutas HTTP, delegar al servicio y retornar
 * respuestas.
 * Toda la lógica de negocio vive en {@link ServicioService}.
 */
@Controller
@RequestMapping("/pasajero")
@RequiredArgsConstructor
public class ControllerPasajero {

    private final ServicioService servicioService;
    private final UsuarioContextHelper usuarioContext;

    @GetMapping("/panel")
    public String mapeopanelpasajero(Model model) {
        Pasajero pasajero = usuarioContext.getPasajeroAutenticado();
        model.addAttribute("pasajero", pasajero);
        return "pasajero/panel_pasajero";
    }

    @PostMapping("/solicitar-viaje")
    @ResponseBody
    public ResponseEntity<?> solicitarViaje(@RequestBody Map<String, Object> solicitud) {
        try {
            Pasajero pasajero = usuarioContext.getPasajeroAutenticado();
            return ResponseEntity.ok(servicioService.solicitarViaje(solicitud, pasajero));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al procesar la solicitud: " + e.getMessage());
        }
    }

    @PostMapping("/cancelar-viaje/{servicioId}")
    @ResponseBody
    public ResponseEntity<?> cancelarViajePasajero(@PathVariable String servicioId) {
        try {
            Pasajero pasajero = usuarioContext.getPasajeroAutenticado();
            return ResponseEntity.ok(servicioService.cancelarViajePasajero(servicioId, pasajero));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Servicio no encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Error al procesar la cancelación: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error interno del servidor al procesar la cancelación"));
        }
    }

    @PostMapping("/actualizar-estado/{servicioId}")
    @ResponseBody
    public ResponseEntity<?> actualizarEstadoServicio(
            @PathVariable String servicioId,
            @RequestBody Map<String, String> request) {
        // Este endpoint delega directamente al service si existe lógica,
        // o se mantiene como stub para compatibilidad con el frontend existente.
        return ResponseEntity.ok(Map.of(
                "mensaje", "Estado del servicio actualizado",
                "servicioId", servicioId));
    }

    @PostMapping("/calificar-servicio/{servicioId}")
    @ResponseBody
    public ResponseEntity<?> calificarServicio(@PathVariable String servicioId,
            @RequestBody Map<String, Object> datosCalificacion) {
        try {
            // Verificamos que el usuario autenticado es un pasajero (autenticación)
            usuarioContext.getPasajeroAutenticado();

            Double calificacion = null;
            if (datosCalificacion.containsKey("calificacion")) {
                calificacion = Double.parseDouble(datosCalificacion.get("calificacion").toString());
                if (calificacion < 0 || calificacion > 5) {
                    return ResponseEntity.badRequest().body("La calificación debe estar entre 0 y 5");
                }
            }
            String comentarios = datosCalificacion.containsKey("comentarios")
                    ? datosCalificacion.get("comentarios").toString()
                    : null;

            return ResponseEntity.ok(
                    servicioService.calificarServicio(servicioId, "pasajero", calificacion, comentarios));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al enviar la calificación: " + e.getMessage());
        }
    }

    @GetMapping("/historial")
    @ResponseBody
    public ResponseEntity<List<Servicio>> obtenerHistorialPasajero(
            @RequestParam(required = false) String fecha,
            @RequestParam(required = false) String conductor) {
        Pasajero pasajero = usuarioContext.getPasajeroAutenticado();
        return ResponseEntity.ok(servicioService.obtenerHistorialPasajero(pasajero, fecha, conductor));
    }

    @GetMapping("/servicios/{servicioId}")
    @ResponseBody
    public ResponseEntity<Servicio> obtenerServicioPasajero(@PathVariable String servicioId) {
        Pasajero pasajero = usuarioContext.getPasajeroAutenticado();
        return ResponseEntity.ok(servicioService.obtenerServicioDePasajero(servicioId, pasajero));
    }
}