package com.example.MotvirsWeb.Security;

import com.example.MotvirsWeb.Models.Conductor;
import com.example.MotvirsWeb.Models.EstadoValidacion;
import com.example.MotvirsWeb.Models.Usuario;
import com.example.MotvirsWeb.Repositorios.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + email));

        if (usuario instanceof Conductor conductor &&
                conductor.getEstadoValidacion() != EstadoValidacion.APROBADO) {
            throw new DisabledException("Cuenta de conductor no aprobada");
        }

        // Devuelve CustomUserDetails con el id del usuario
        return new CustomUserDetails(
                usuario.getIdString(),
                usuario.getEmail(),
                usuario.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(usuario.getRol().getAuthority())), // Ajusta según tu método getRol()
                usuario.getEstadoValidacion() == EstadoValidacion.APROBADO
        );
    }
}