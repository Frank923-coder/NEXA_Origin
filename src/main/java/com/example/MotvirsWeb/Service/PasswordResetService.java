package com.example.MotvirsWeb.Service;

import com.example.MotvirsWeb.Models.Conductor;
import com.example.MotvirsWeb.Models.Usuario;
import com.example.MotvirsWeb.Repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;


@Service
public class PasswordResetService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // CAMBIO 1: Quitamos JavaMailSender y @Value
    // Inyectamos EmailService que es el experto en envíos y URLs
    @Autowired
    private EmailService emailService;

    private static final long EXPIRE_TOKEN_AFTER_MINUTES = 30;

    public void initiatePasswordReset(String email) {
        // Buscar primero en los usuarios
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isPresent()) {
            procesarReset(usuarioOpt.get(), "usuario");
            return;
        }

        // Si no es usuario, buscar en conductor
        Optional<Usuario> conductorOpt = usuarioRepository.findByEmail(email); // Asumo que findByEmail busca en ambos o tienes lógica polimórfica

        // NOTA: En tu código original usabas usuarioRepository para ambos.
        // Si conductor está en la misma colección, esto funciona.
        if (conductorOpt.isPresent()) {
            // Si ya lo encontraste arriba, no entrará aquí, pero mantengo tu lógica
            // Si son entidades distintas, asegúrate de que 'conductorOpt' sea correcto.
            procesarReset(conductorOpt.get(), "conductor");
            return;
        }

        throw new RuntimeException("No se encontró ninguna cuenta con ese correo electrónico");
    }

    // Método auxiliar para no repetir código (DRY)
    private void procesarReset(Usuario usuario, String tipo) {
        String token = generateToken();
        usuario.setResetPasswordToken(token);
        usuario.setResetPasswordTokenExpiry(LocalDateTime.now().plusMinutes(EXPIRE_TOKEN_AFTER_MINUTES));
        usuarioRepository.save(usuario);

        // CAMBIO 2: Usamos EmailService.
        // Él se encarga de buscar la BaseURL correcta (HTTPS) y enviar el correo.
        emailService.enviarCorreoRecuperacion(usuario.getEmail(), token);
    }

    public void resetPassword(String token, String newPassword) {
        // Buscar usuario por token
        Optional<Usuario> usuarioOpt = usuarioRepository.findByResetPasswordToken(token);

        if (usuarioOpt.isPresent()) {
            actualizarPassword(usuarioOpt.get(), newPassword);
            return;
        }

        throw new RuntimeException("Token inválido o no encontrado");
    }

    private void actualizarPassword(Usuario usuario, String newPassword) {
        if (isTokenExpired(usuario.getResetPasswordTokenExpiry())) {
            throw new RuntimeException("El token ha expirado");
        }

        usuario.setPassword(passwordEncoder.encode(newPassword));
        usuario.setResetPasswordToken(null);
        usuario.setResetPasswordTokenExpiry(null);
        usuarioRepository.save(usuario);
    }

    private String generateToken() {
        return UUID.randomUUID().toString();
    }

    private boolean isTokenExpired(LocalDateTime tokenExpiry) {
        return tokenExpiry == null || LocalDateTime.now().isAfter(tokenExpiry);
    }

    // CAMBIO 3: Eliminamos el método 'sendResetEmail' privado antiguo.
    // CAMBIO 4: Eliminamos las variables @Value de baseUrl y fromEmail de esta clase.

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado.");
        }

        Usuario usuario = usuarioOpt.get();

        if (!passwordEncoder.matches(currentPassword, usuario.getPassword())) {
            throw new BadCredentialsException("La contraseña actual es incorrecta.");
        }

        usuario.setPassword(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);
    }
}
