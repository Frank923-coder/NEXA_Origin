package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.Conductor;
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
 * REST Controller para el Conductor (Mobile API).
 * 
 * Sigue el principio SOLID de Responsabilidad Única (SRP):
 * Solo maneja la capa de transporte REST y delega la lógica a ServicioService.
 */
@RestController
@RequestMapping("/api/conductor")
@RequiredArgsConstructor
public class ApiConductorController {

    private final ServicioService servicioService;
    private final UsuarioContextHelper usuarioContext;

    @GetMapping("/perfil")
    public ResponseEntity<Conductor> obtenerPerfil() {
        return ResponseEntity.ok(usuarioContext.getConductorAutenticado());
    }

    @GetMapping("/servicios-disponibles")
    public ResponseEntity<List<Servicio>> obtenerServiciosDisponibles() {
        return ResponseEntity.ok(servicioService.obtenerServiciosDisponibles());
    }

    @PostMapping("/aceptar-servicio/{servicioId}")
    public ResponseEntity<?> aceptarServicio(@PathVariable String servicioId) {
        try {
            Conductor conductor = usuarioContext.getConductorAutenticado();
            return ResponseEntity.ok(servicioService.aceptarServicio(servicioId, conductor));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/iniciar-servicio/{servicioId}")
    public ResponseEntity<?> iniciarServicio(@PathVariable String servicioId) {
        try {
            Conductor conductor = usuarioContext.getConductorAutenticado();
            return ResponseEntity.ok(servicioService.iniciarServicio(servicioId, conductor));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/finalizar-servicio/{servicioId}")
    public ResponseEntity<?> finalizarServicio(@PathVariable String servicioId) {
        try {
            Conductor conductor = usuarioContext.getConductorAutenticado();
            return ResponseEntity.ok(servicioService.finalizarServicio(servicioId, conductor));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/cancelar-servicio/{servicioId}")
    public ResponseEntity<?> cancelarServicio(@PathVariable String servicioId) {
        try {
            Conductor conductor = usuarioContext.getConductorAutenticado();
            return ResponseEntity.ok(servicioService.cancelarServicioConductor(servicioId, conductor));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/servicios-en-curso")
    public ResponseEntity<List<Servicio>> obtenerServiciosEnCurso() {
        Conductor conductor = usuarioContext.getConductorAutenticado();
        return ResponseEntity.ok(servicioService.obtenerServiciosEnCurso(conductor));
    }

    @GetMapping("/historial")
    public ResponseEntity<List<Servicio>> obtenerHistorial(
            @RequestParam(required = false) String fecha,
            @RequestParam(required = false) String pasajero) {
        Conductor conductor = usuarioContext.getConductorAutenticado();
        return ResponseEntity.ok(servicioService.obtenerHistorialConductor(conductor, fecha, pasajero));
    }

    @GetMapping("/ingresos")
    public ResponseEntity<List<Map<String, Object>>> obtenerIngresos(
            @RequestParam(required = false) String periodo,
            @RequestParam(required = false) String fecha) {
        Conductor conductor = usuarioContext.getConductorAutenticado();
        return ResponseEntity.ok(servicioService.obtenerIngresosConductor(conductor, periodo, fecha));
    }
}
