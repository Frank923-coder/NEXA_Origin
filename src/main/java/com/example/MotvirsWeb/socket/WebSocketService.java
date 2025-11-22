package com.example.MotvirsWeb.socket;

import com.example.MotvirsWeb.Models.EstadoServicio;
import com.example.MotvirsWeb.Models.Servicio;
import com.example.MotvirsWeb.Models.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class WebSocketService {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notificarCambioEstadoServicio(Servicio servicio) {
        // Notificar al pasajero
        messagingTemplate.convertAndSend("/topic/pasajero/" + servicio.getPasajero().getId(), servicio);

        // Notificar al conductor (si existe)
        if (servicio.getConductor() != null) {
            messagingTemplate.convertAndSend("/topic/conductor/" + servicio.getConductor().getId(), servicio);
        }
    }

    public void notificarNuevoServicioDisponible(Servicio servicio) {
        // Notificar a todos los conductores sobre nuevo servicio disponible
        messagingTemplate.convertAndSend("/topic/servicios-disponibles", servicio);
    }

    public void notificarNuevoRegistroAdmin(Usuario nuevoUsuario) {
        Map<String, Object> notificacion = new HashMap<>();
        notificacion.put("tipo", "NUEVO_REGISTRO");
        notificacion.put("email", nuevoUsuario.getEmail());
        notificacion.put("rol", nuevoUsuario.getRol().toString());
        notificacion.put("fecha", nuevoUsuario.getFechaRegistro() != null ? nuevoUsuario.getFechaRegistro().toString() : "Ahora");

        // Enviamos al topic específico
        messagingTemplate.convertAndSend("/topic/admin/registros", notificacion);
    }

    public void notificarNuevoRegistroAdmin(String email, String rol) {
        Map<String, Object> notificacion = new HashMap<>();
        notificacion.put("tipo", "NUEVO_REGISTRO");
        notificacion.put("email", email);
        notificacion.put("rol", rol);
        notificacion.put("fecha", java.time.LocalDateTime.now().toString());
        messagingTemplate.convertAndSend("/topic/admin/registros", notificacion);
    }
}