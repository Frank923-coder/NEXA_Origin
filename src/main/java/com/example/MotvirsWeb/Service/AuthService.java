package com.example.MotvirsWeb.Service;

import com.example.MotvirsWeb.Models.*;
import com.example.MotvirsWeb.Repositorios.UsuarioRepository;
import com.example.MotvirsWeb.Security.CustomUserDetailsService;
import com.example.MotvirsWeb.socket.WebSocketService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    // Logger para registrar errores del socket sin detener la app
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomUserDetailsService customUserDetailsService;
    private final WebSocketService webSocketService;

    /**
     * Registra un nuevo usuario en el sistema - Versión mejorada y optimizada
     */
    public Usuario registrarUsuario(String email, String password, Rol rol, String nombre) {
        // 1. Creación de la instancia (Factory)
        Usuario usuario = Usuario.crearUsuario(rol, email, usuarioRepository);

        // 2. Asignación de datos (Antes de guardar)
        usuario.setPassword(passwordEncoder.encode(password));

        // Campos específicos por tipo de usuario
        if (usuario instanceof Pasajero pasajero) {
            pasajero.setNombreCompleto(nombre);
        } else if (usuario instanceof Conductor conductor) {
            conductor.setNombre_y_Apellido(nombre);
        }

        Usuario usuarioGuardado = usuarioRepository.save(usuario);
        enviarNotificacionAdminSegura(usuarioGuardado);

        return usuarioGuardado;
    }

    public Pasajero registrarPasajero(String nombreCompleto, String documentoIdentidad, String email,
            String telefono, String password) {
        if (usuarioRepository.findByEmailAndRol(email, Rol.PASAJERO).isPresent()) {
            throw new IllegalStateException("Ya existe un pasajero registrado con este email: " + email);
        }

        Pasajero pasajero = Pasajero.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .rol(Rol.PASAJERO)
                .estadoValidacion(EstadoValidacion.APROBADO)
                .nombreCompleto(nombreCompleto)
                .documentoIdentidad(documentoIdentidad)
                .telefono(telefono)
                .fechaAceptacionTerminos(LocalDateTime.now())
                .versionTerminos("v1.0-2026")
                .build();

        Pasajero pasajeroGuardado = usuarioRepository.save(pasajero);
        enviarNotificacionAdminSegura(pasajeroGuardado);
        return pasajeroGuardado;
    }

    public Conductor registrarConductor(String nombre, String documentoIdentidad, String email, String password, String licencia) {
        // Validación
        if (usuarioRepository.findByEmailAndRol(email, Rol.CONDUCTOR).isPresent()) {
            throw new IllegalStateException("Ya existe un conductor registrado con este email: " + email);
        }

        // Construcción del objeto
        Conductor conductor = Conductor.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .rol(Rol.CONDUCTOR)
                .estadoValidacion(EstadoValidacion.PENDIENTE)
                .nombre_y_Apellido(nombre)
                .documentoIdentidad(documentoIdentidad)
                .licenciaNumero(licencia)
                .fechaAceptacionTerminos(LocalDateTime.now())
                .versionTerminos("v1.0-2026")
                .build();

        // Guardado en BD
        Conductor conductorGuardado = usuarioRepository.save(conductor);

        // Notificación al Admin (Socket)
        enviarNotificacionAdminSegura(conductorGuardado);

        return conductorGuardado;
    }

    /**
     * Método auxiliar para manejar la notificación sin romper el flujo de registro
     * si el socket falla.
     */
    // Método seguro para sockets
    private void enviarNotificacionAdminSegura(Usuario usuario) {
        try {
            webSocketService.notificarNuevoRegistroAdmin(usuario);
        } catch (Exception e) {
            logger.error("Error socket admin: {}", e.getMessage());
        }
    }

    public UserDetails autenticarUsuario(String email, String password) {
        try {
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);

            if (!passwordEncoder.matches(password, userDetails.getPassword())) {
                throw new BadCredentialsException("Credenciales inválidas");
            }

            // Verificación adicional de estado para conductores
            Usuario usuario = usuarioRepository.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

            if (usuario.getRol() == Rol.CONDUCTOR &&
                    usuario.getEstadoValidacion() != EstadoValidacion.APROBADO) {
                throw new DisabledException("Cuenta de conductor no aprobada");
            }

            return userDetails;
        } catch (UsernameNotFoundException e) {
            throw new BadCredentialsException("Credenciales inválidas", e);
        }
    }
}