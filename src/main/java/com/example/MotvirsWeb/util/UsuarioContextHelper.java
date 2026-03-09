package com.example.MotvirsWeb.util;

import com.example.MotvirsWeb.Models.Conductor;
import com.example.MotvirsWeb.Models.Pasajero;
import com.example.MotvirsWeb.Models.Usuario;
import com.example.MotvirsWeb.Repositorios.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Helper de contexto de autenticación.
 *
 * Encapsula el patrón repetido en todos los controllers:
 * 1. Obtener email del principal activo en SecurityContext.
 * 2. Buscar el Usuario en base de datos.
 * 3. Validar y castear al subtipo concreto (Conductor / Pasajero).
 *
 * Principio aplicado: SRP — un solo lugar donde vive esta lógica de
 * infraestructura.
 */
@Component
@RequiredArgsConstructor
public class UsuarioContextHelper {

    private final UsuarioRepository usuarioRepository;

    /**
     * Retorna el email del usuario actualmente autenticado.
     */
    public String getEmailAutenticado() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    /**
     * Retorna el Usuario autenticado genérico.
     * 
     * @throws RuntimeException si el email no corresponde a ningún usuario.
     */
    public Usuario getUsuarioAutenticado() {
        String email = getEmailAutenticado();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + email));
    }

    /**
     * Retorna el Conductor autenticado.
     * 
     * @throws RuntimeException si el usuario no es un Conductor.
     */
    public Conductor getConductorAutenticado() {
        Usuario usuario = getUsuarioAutenticado();
        if (!(usuario instanceof Conductor)) {
            throw new RuntimeException("El usuario autenticado no es un Conductor");
        }
        return (Conductor) usuario;
    }

    /**
     * Retorna el Pasajero autenticado.
     * 
     * @throws RuntimeException si el usuario no es un Pasajero.
     */
    public Pasajero getPasajeroAutenticado() {
        Usuario usuario = getUsuarioAutenticado();
        if (!(usuario instanceof Pasajero)) {
            throw new RuntimeException("El usuario autenticado no es un Pasajero");
        }
        return (Pasajero) usuario;
    }
}
