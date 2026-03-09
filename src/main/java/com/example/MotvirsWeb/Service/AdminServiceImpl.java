package com.example.MotvirsWeb.Service;

import com.example.MotvirsWeb.Models.*;
import com.example.MotvirsWeb.Repositorios.UsuarioRepository;
import com.example.MotvirsWeb.socket.WebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UsuarioRepository usuarioRepository;
    private final WebSocketService webSocketService;

    @Override
    public Map<String, Object> obtenerResumenDashboard() {
        Map<String, Object> resumen = new HashMap<>();
        resumen.put("totalPasajeros", usuarioRepository.countByRol(Rol.PASAJERO));
        resumen.put("totalConductores",
                usuarioRepository.countByRolAndEstadoValidacion(Rol.CONDUCTOR, EstadoValidacion.APROBADO));

        resumen.put("conductoresPendientes", obtenerConductoresPorEstado(EstadoValidacion.PENDIENTE));
        resumen.put("conductoresAprobados", obtenerConductoresPorEstado(EstadoValidacion.APROBADO));
        resumen.put("conductoresRechazados", obtenerConductoresPorEstado(EstadoValidacion.RECHAZADO));

        return resumen;
    }

    @Override
    public List<Conductor> obtenerConductoresPorEstado(EstadoValidacion estado) {
        return usuarioRepository.findByRolAndEstadoValidacion(Rol.CONDUCTOR, estado)
                .stream()
                .map(u -> (Conductor) u)
                .collect(Collectors.toList());
    }

    @Override
    public void aprobarConductor(String email) {
        Conductor conductor = usuarioRepository.findConductorByEmail(email)
                .orElseThrow(() -> new RuntimeException("Conductor no encontrado"));

        if (conductor.getEstadoValidacion() != EstadoValidacion.PENDIENTE) {
            throw new RuntimeException("El conductor no está pendiente de aprobación");
        }

        conductor.setEstadoValidacion(EstadoValidacion.APROBADO);
        usuarioRepository.save(conductor);

        // Notificación WebSocket
        webSocketService.notificarNuevoRegistroAdmin(conductor);
    }

    @Override
    public void rechazarConductor(String email) {
        Conductor conductor = usuarioRepository.findConductorByEmail(email)
                .orElseThrow(() -> new RuntimeException("Conductor no encontrado"));

        if (conductor.getEstadoValidacion() != EstadoValidacion.PENDIENTE) {
            throw new RuntimeException("El conductor no está pendiente de aprobación");
        }

        conductor.setEstadoValidacion(EstadoValidacion.RECHAZADO);
        usuarioRepository.save(conductor);
    }

    @Override
    public Map<String, Object> obtenerEstadisticasAjax() {
        Map<String, Object> datos = new HashMap<>();
        datos.put("pasajeros", usuarioRepository.countByRol(Rol.PASAJERO));
        datos.put("conductoresAprobados",
                usuarioRepository.countByRolAndEstadoValidacion(Rol.CONDUCTOR, EstadoValidacion.APROBADO));
        datos.put("conductoresPendientes",
                usuarioRepository.countByRolAndEstadoValidacion(Rol.CONDUCTOR, EstadoValidacion.PENDIENTE));
        return datos;
    }

    @Override
    public List<Usuario> obtenerTodosLosConductores() {
        return usuarioRepository.findByRol(Rol.CONDUCTOR);
    }

    @Override
    public void actualizarPreferenciaNotificaciones(String email, boolean habilitado) {
        Admin admin = usuarioRepository.findAdminByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin no encontrado"));

        admin.setRecibirNotificaciones(habilitado);
        usuarioRepository.save(admin);
    }
}
