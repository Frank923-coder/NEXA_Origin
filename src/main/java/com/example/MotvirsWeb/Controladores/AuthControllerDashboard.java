package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.*;
import com.example.MotvirsWeb.Repositorios.UsuarioRepository;
import com.example.MotvirsWeb.Service.DashboardService;
import com.example.MotvirsWeb.socket.WebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AuthControllerDashboard {


    private final UsuarioRepository usuarioRepository;
    private final DashboardService dashboardService;
    private final WebSocketService webSocketService;

    // Método principal para mostrar el dashboard
    @GetMapping("/dashboard")
    public String mostrarDashboard(Model model, Principal principal) {
        // 1. Conteos optimizados para los gráficos
        model.addAttribute("totalPasajeros", usuarioRepository.countByRol(Rol.PASAJERO));
        model.addAttribute("totalConductores",
                usuarioRepository.countByRolAndEstadoValidacion(Rol.CONDUCTOR, EstadoValidacion.APROBADO));

        // 2. Datos completos para la tabla
        model.addAttribute("conductoresPendientes", obtenerConductores(EstadoValidacion.PENDIENTE));
        model.addAttribute("conductoresAprobados", obtenerConductores(EstadoValidacion.APROBADO));
        model.addAttribute("conductoresRechazados", obtenerConductores(EstadoValidacion.RECHAZADO));

        model.addAttribute("EstadoValidacion", EstadoValidacion.class);

        if (principal != null) {
            usuarioRepository.findAdminByEmail(principal.getName())
                    .ifPresent(admin -> model.addAttribute("notificacionesActivas", admin.isRecibirNotificaciones()));
        }

        return "panel_admin";
    }

    // Método para obtener conductores por estado (reutilizable)
    private List<Conductor> obtenerConductores(EstadoValidacion estado) {
        return usuarioRepository.findByRolAndEstadoValidacion(Rol.CONDUCTOR, estado)
                .stream()
                .map(u -> (Conductor) u)
                .collect(Collectors.toList());
    }

    // Método para aprobar conductores (similar al tuyo)
    @PostMapping("/aprobar-conductor")
    public String aprobarConductor(
            @RequestParam String email, // 1. Aquí se llama 'email'
            RedirectAttributes redirectAttributes) {

        try {
            // Buscamos el conductor
            Conductor conductor = usuarioRepository.findConductorByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Conductor no encontrado"));

            // Validamos estado
            if (conductor.getEstadoValidacion() != EstadoValidacion.PENDIENTE) {
                throw new RuntimeException("El conductor no está pendiente de aprobación");
            }

            // Aprobamos y guardamos
            conductor.setEstadoValidacion(EstadoValidacion.APROBADO);
            usuarioRepository.save(conductor);

            // Mensaje de éxito
            redirectAttributes.addFlashAttribute("success",
                    "Conductor " + conductor.getNombre_y_Apellido() + " aprobado exitosamente");

            // 2. NOTIFICACIÓN WEBSOCKET (Dentro del Try)
            // No necesitas crear un new Usuario(), usa el conductor que ya tienes.
            // El servicio espera un Usuario, y Conductor hereda de Usuario, así que es válido.
            webSocketService.notificarNuevoRegistroAdmin(conductor);

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }

        return "redirect:/admin/dashboard"; // 3. Solo un return
    }

    // Método para rechazar conductores (similar al tuyo)
    @PostMapping("/rechazar-conductor")
    public String rechazarConductor(
            @RequestParam String email,
            RedirectAttributes redirectAttributes) {

        try {
            Conductor conductor = usuarioRepository.findConductorByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Conductor no encontrado"));

            if (conductor.getEstadoValidacion() != EstadoValidacion.PENDIENTE) {
                throw new RuntimeException("El conductor no está pendiente de aprobación");
            }

            conductor.setEstadoValidacion(EstadoValidacion.RECHAZADO);
            usuarioRepository.save(conductor);

            redirectAttributes.addFlashAttribute("success",
                    "Conductor " + conductor.getNombre_y_Apellido() + " rechazado");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }

        return "redirect:/admin/dashboard";
    }

    @GetMapping("/dashboard/registros-mensuales")
    @ResponseBody
    public Map<String, Object> obtenerRegistrosMensuales() {
        return dashboardService.obtenerEstadisticasMensuales();
    }

    // Endpoint para AJAX - Actualización parcial de datos
    @GetMapping("/dashboard/actualizar")
    @ResponseBody
    public Map<String, Object> actualizarDatosDashboard() {
        Map<String, Object> datos = new HashMap<>();
        datos.put("pasajeros", usuarioRepository.countByRol(Rol.PASAJERO));
        datos.put("conductoresAprobados",
                usuarioRepository.countByRolAndEstadoValidacion(Rol.CONDUCTOR, EstadoValidacion.APROBADO));
        datos.put("conductoresPendientes",
                usuarioRepository.countByRolAndEstadoValidacion(Rol.CONDUCTOR, EstadoValidacion.PENDIENTE));

        return datos;
    }

    @GetMapping("/conductores/actualizar")
    @ResponseBody
    public ResponseEntity<List<Usuario>> obtenerConductoresParaTabla() {
        try {
            // Obtenemos TODOS los conductores para que el JS los filtre
            List<Usuario> conductores = usuarioRepository.findByRol(Rol.CONDUCTOR);
            return ResponseEntity.ok(conductores);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ✅ NUEVO: Endpoint para el Toggle Switch
    @PostMapping("/config/notificaciones")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> actualizarNotificaciones(
            @RequestParam boolean habilitado,
            Principal principal) {

        Map<String, Object> response = new HashMap<>();
        try {
            Admin admin = usuarioRepository.findAdminByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Admin no encontrado"));

            admin.setRecibirNotificaciones(habilitado);
            usuarioRepository.save(admin);

            response.put("success", true);
            response.put("message", habilitado ? "Notificaciones activadas" : "Notificaciones desactivadas");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            return ResponseEntity.badRequest().body(response);
        }
    }
}