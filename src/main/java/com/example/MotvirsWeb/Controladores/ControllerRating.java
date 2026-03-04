package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Service.ServicioService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import com.example.MotvirsWeb.Repositorios.ServicioRepository;
import com.example.MotvirsWeb.Models.Servicio;

import java.security.Principal;

/**
 * Controller HTTP para calificaciones post-viaje.
 *
 * Responsabilidad única: presentar la pantalla de rating y procesar el
 * formulario.
 * La lógica de persistencia de calificaciones vive en {@link ServicioService}.
 */
@Controller
@RequestMapping("/rating")
@RequiredArgsConstructor
public class ControllerRating {

    private final ServicioService servicioService;
    private final ServicioRepository servicioRepository; // solo para cargar datos de vista

    @GetMapping
    @PreAuthorize("hasRole(#rol != null ? #rol.toUpperCase() : 'USER')")
    public String mostrarRating(@RequestParam("servicioId") String servicioId,
            @RequestParam(value = "rol", required = false) String rol,
            Model model, Principal principal) {

        Servicio servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new RuntimeException("Servicio no encontrado"));

        model.addAttribute("servicioId", servicioId);
        model.addAttribute("rol", rol);

        String nombreOtro = "";
        if ("conductor".equals(rol) && servicio.getPasajero() != null) {
            nombreOtro = servicio.getPasajero().getNombre();
        } else if ("pasajero".equals(rol) && servicio.getConductor() != null) {
            nombreOtro = servicio.getConductor().getNombre();
        }
        model.addAttribute("nombreOtro", nombreOtro);

        return "rating";
    }

    @PostMapping("/calificar")
    @PreAuthorize("hasRole(#rol != null ? #rol.toUpperCase() : 'USER')")
    public String calificarServicio(
            @RequestParam String servicioId,
            @RequestParam Double calificacion,
            @RequestParam(required = false) String comentarios,
            @RequestParam String rol,
            Authentication authentication) {

        // Validación de seguridad: el rol del parámetro debe coincidir con el rol
        // autenticado
        String authRole = authentication.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", "").toLowerCase())
                .orElse("user");

        if (!rol.equals(authRole)) {
            throw new RuntimeException("Rol no autorizado para esta calificación");
        }

        servicioService.calificarServicio(servicioId, rol, calificacion, comentarios);

        return "pasajero".equals(rol)
                ? "redirect:/pasajero/panel"
                : "redirect:/conductor/panel";
    }
}