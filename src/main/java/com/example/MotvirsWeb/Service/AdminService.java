package com.example.MotvirsWeb.Service;

import com.example.MotvirsWeb.Models.Conductor;
import com.example.MotvirsWeb.Models.EstadoValidacion;
import com.example.MotvirsWeb.Models.Usuario;
import java.util.List;
import java.util.Map;

public interface AdminService {
    Map<String, Object> obtenerResumenDashboard();

    List<Conductor> obtenerConductoresPorEstado(EstadoValidacion estado);

    void aprobarConductor(String email);

    void rechazarConductor(String email);

    Map<String, Object> obtenerEstadisticasAjax();

    List<Usuario> obtenerTodosLosConductores();

    void actualizarPreferenciaNotificaciones(String email, boolean habilitado);
}
