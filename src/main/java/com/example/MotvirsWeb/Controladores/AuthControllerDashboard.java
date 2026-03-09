package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.*;
import com.example.MotvirsWeb.Service.AdminService;
import com.example.MotvirsWeb.Service.DashboardService;
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

/**
 * Controller Web para el Dashboard del Administrador.
 * 
 * Aplicando SOLID: Este controlador solo se encarga de la navegación web y
 * delega toda la lógica de negocio a AdminService.
 */
@Controller
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AuthControllerDashboard {

    private final AdminService adminService;
    private final DashboardService dashboardService;

    @GetMapping("/dashboard")
    public String mostrarDashboard(Model model, Principal principal) {
        // Obtenemos todo el resumen desde el servicio
        Map<String, Object> resumen = adminService.obtenerResumenDashboard();
        model.addAllAttributes(resumen);

        model.addAttribute("EstadoValidacion", EstadoValidacion.class);

        if (principal != null) {
            // Podríamos mover esto a AdminService también para total pureza
            model.addAttribute("notificacionesActivas", true); // Simplificado para la vista web
        }

        return "panel_admin";
    }

    @PostMapping("/aprobar-conductor")
    public String aprobarConductor(@RequestParam String email, RedirectAttributes redirectAttributes) {
        try {
            adminService.aprobarConductor(email);
            redirectAttributes.addFlashAttribute("success", "Conductor aprobado exitosamente");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/dashboard";
    }

    @PostMapping("/rechazar-conductor")
    public String rechazarConductor(@RequestParam String email, RedirectAttributes redirectAttributes) {
        try {
            adminService.rechazarConductor(email);
            redirectAttributes.addFlashAttribute("success", "Conductor rechazado");
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

    @GetMapping("/dashboard/actualizar")
    @ResponseBody
    public Map<String, Object> actualizarDatosDashboard() {
        return adminService.obtenerEstadisticasAjax();
    }

    @GetMapping("/conductores/actualizar")
    @ResponseBody
    public ResponseEntity<List<Usuario>> obtenerConductoresParaTabla() {
        return ResponseEntity.ok(adminService.obtenerTodosLosConductores());
    }

    @PostMapping("/config/notificaciones")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> actualizarNotificaciones(
            @RequestParam boolean habilitado,
            Principal principal) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.actualizarPreferenciaNotificaciones(principal.getName(), habilitado);
            response.put("success", true);
            response.put("message", habilitado ? "Notificaciones activadas" : "Notificaciones desactivadas");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            return ResponseEntity.badRequest().body(response);
        }
    }
}
