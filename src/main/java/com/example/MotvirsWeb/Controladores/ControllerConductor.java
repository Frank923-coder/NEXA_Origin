package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.Conductor;
import com.example.MotvirsWeb.Models.EstadoServicio;
import com.example.MotvirsWeb.Models.Servicio;
import com.example.MotvirsWeb.Repositorios.ServicioRepository;
import com.example.MotvirsWeb.Service.ServicioService;
import com.example.MotvirsWeb.util.UsuarioContextHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * Controller HTTP para el Conductor.
 *
 * Responsabilidad única: mapear rutas HTTP, delegar al servicio y retornar
 * respuestas.
 * Toda la lógica de negocio vive en {@link ServicioService}.
 */
@Controller
@RequestMapping("/conductor")
@RequiredArgsConstructor
public class ControllerConductor {

    private final ServicioService servicioService;
    private final UsuarioContextHelper usuarioContext;
    private final ServicioRepository servicioRepository; // solo para la vista del panel

    @GetMapping("/panel")
    public String mapearpanelconductor(Model model) {
        Conductor conductor = usuarioContext.getConductorAutenticado();

        List<Servicio> serviciosDisponibles = servicioService.obtenerServiciosDisponibles();
        List<Servicio> serviciosEnCurso = servicioService.obtenerServiciosEnCurso(conductor);
        List<Servicio> historialServicios = servicioService.obtenerHistorialConductor(conductor, null, null);
        List<Servicio> serviciosCalificados = servicioRepository
                .findByConductorIdAndCalificacionPasajeroIsNotNull(conductor.getId());

        model.addAttribute("conductor", conductor);
        model.addAttribute("serviciosDisponibles", serviciosDisponibles);
        model.addAttribute("serviciosEnCurso", serviciosEnCurso);
        model.addAttribute("historialServicios", historialServicios);
        model.addAttribute("serviciosCalificados", serviciosCalificados);

        return "conductor/panel_conductor";
    }

    @PostMapping("/aceptar-servicio/{servicioId}")
    @ResponseBody
    public ResponseEntity<?> aceptarServicio(@PathVariable String servicioId) {
        try {
            Conductor conductor = usuarioContext.getConductorAutenticado();
            return ResponseEntity.ok(servicioService.aceptarServicio(servicioId, conductor));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al aceptar el servicio: " + e.getMessage());
        }
    }

    @PostMapping("/iniciar-servicio/{servicioId}")
    @ResponseBody
    public ResponseEntity<?> iniciarServicio(@PathVariable String servicioId) {
        try {
            Conductor conductor = usuarioContext.getConductorAutenticado();
            return ResponseEntity.ok(servicioService.iniciarServicio(servicioId, conductor));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al iniciar el viaje: " + e.getMessage());
        }
    }

    @PostMapping("/finalizar-servicio/{servicioId}")
    @ResponseBody
    public ResponseEntity<?> finalizarServicio(@PathVariable String servicioId,
            @RequestBody(required = false) Map<String, Object> datosFinalizacion) {
        try {
            Conductor conductor = usuarioContext.getConductorAutenticado();
            return ResponseEntity.ok(servicioService.finalizarServicio(servicioId, conductor));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al finalizar el servicio: " + e.getMessage());
        }
    }

    @PostMapping("/cancelar-servicio/{servicioId}")
    @ResponseBody
    public ResponseEntity<?> cancelarServicio(@PathVariable String servicioId) {
        try {
            Conductor conductor = usuarioContext.getConductorAutenticado();
            return ResponseEntity.ok(servicioService.cancelarServicioConductor(servicioId, conductor));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al cancelar el servicio: " + e.getMessage());
        }
    }

    @GetMapping("/servicios-disponibles")
    @ResponseBody
    public ResponseEntity<List<Servicio>> obtenerServiciosDisponibles() {
        return ResponseEntity.ok(servicioService.obtenerServiciosDisponibles());
    }

    @GetMapping("/servicios-en-curso")
    @ResponseBody
    public ResponseEntity<List<Servicio>> obtenerServiciosEnCurso() {
        try {
            Conductor conductor = usuarioContext.getConductorAutenticado();
            return ResponseEntity.ok(servicioService.obtenerServiciosEnCurso(conductor));
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    @GetMapping("/servicios/{servicioId}")
    @ResponseBody
    public ResponseEntity<Servicio> obtenerServicio(@PathVariable String servicioId) {
        return ResponseEntity.ok(servicioService.obtenerServicioPorId(servicioId));
    }

    @GetMapping("/historial")
    @ResponseBody
    public ResponseEntity<List<Servicio>> obtenerHistorial(
            @RequestParam(required = false) String fecha,
            @RequestParam(required = false) String pasajero) {
        Conductor conductor = usuarioContext.getConductorAutenticado();
        return ResponseEntity.ok(servicioService.obtenerHistorialConductor(conductor, fecha, pasajero));
    }

    @GetMapping("/ingresos")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerIngresos(
            @RequestParam(required = false) String periodo,
            @RequestParam(required = false) String fecha) {
        Conductor conductor = usuarioContext.getConductorAutenticado();
        return ResponseEntity.ok(servicioService.obtenerIngresosConductor(conductor, periodo, fecha));
    }
}