package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.Conductor;
import com.example.MotvirsWeb.Models.EstadoValidacion;
import com.example.MotvirsWeb.Models.Usuario;
import com.example.MotvirsWeb.Service.AdminService;
import com.example.MotvirsWeb.Service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * REST Controller para el Administrador (Mobile API).
 * 
 * Reutiliza la lógica de AdminService para exponer funcionalidades a la app
 * móvil.
 * Todas estas rutas están protegidas por JWT y el rol de ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class ApiAdminController {

    private final AdminService adminService;
    private final DashboardService dashboardService;

    @GetMapping("/dashboard-stats")
    public ResponseEntity<Map<String, Object>> obtenerResumen() {
        return ResponseEntity.ok(adminService.obtenerResumenDashboard());
    }

    @GetMapping("/conductores")
    public ResponseEntity<List<Conductor>> obtenerConductores(@RequestParam EstadoValidacion estado) {
        return ResponseEntity.ok(adminService.obtenerConductoresPorEstado(estado));
    }

    @PostMapping("/aprobar-conductor")
    public ResponseEntity<Map<String, String>> aprobarConductor(@RequestParam String email) {
        try {
            adminService.aprobarConductor(email);
            return ResponseEntity.ok(Map.of("message", "Conductor aprobado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/rechazar-conductor")
    public ResponseEntity<Map<String, String>> rechazarConductor(@RequestParam String email) {
        try {
            adminService.rechazarConductor(email);
            return ResponseEntity.ok(Map.of("message", "Conductor rechazado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/estadisticas-mensuales")
    public ResponseEntity<Map<String, Object>> obtenerStatsMensuales() {
        return ResponseEntity.ok(dashboardService.obtenerEstadisticasMensuales());
    }

    @PostMapping("/config/notificaciones")
    public ResponseEntity<Map<String, Object>> toggleNotificaciones(
            @RequestParam boolean habilitado,
            Principal principal) {
        try {
            adminService.actualizarPreferenciaNotificaciones(principal.getName(), habilitado);
            return ResponseEntity.ok(Map.of("success", true, "enabled", habilitado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
