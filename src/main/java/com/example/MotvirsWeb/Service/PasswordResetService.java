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

    @Autowired
    private JavaMailSender mailSender;



    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private static final long EXPIRE_TOKEN_AFTER_MINUTES = 30;

    public void initiatePasswordReset(String email) {
        //Buscar primero en los usuarios
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            String token = generateToken();
            usuario.setResetPasswordToken(token);
            usuario.setResetPasswordTokenExpiry(LocalDateTime.now().plusMinutes(EXPIRE_TOKEN_AFTER_MINUTES));
            usuarioRepository.save(usuario);
            sendResetEmail(usuario.getEmail(), token, "usuario");
            return;
        }

        // Si no es usuario, buscar en conductor
        Optional<Usuario> conductorOpt = usuarioRepository.findByEmail(email);

        if (conductorOpt.isPresent()) {
            Usuario conductor = conductorOpt.get();
            String token = generateToken();
            conductor.setResetPasswordToken(token);
            conductor.setResetPasswordTokenExpiry(LocalDateTime.now().plusMinutes(EXPIRE_TOKEN_AFTER_MINUTES));
            usuarioRepository.save(conductor);
            sendResetEmail(conductor.getEmail(), token, "conductor");
            return;
        }

        throw new RuntimeException("No se encontró ninguna cuenta con ese correo electrónico");







    }

    public void resetPassword(String token, String newPassword) {
        // Buscar en usuarios
        Optional<Usuario> usuarioOpt = usuarioRepository.findByResetPasswordToken(token);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            if (isTokenExpired(usuario.getResetPasswordTokenExpiry())) {
                throw new RuntimeException("El token ha expirado");
            }
            // Encriptar la nueva contraseña
            usuario.setPassword(passwordEncoder.encode(newPassword));
            usuario.setResetPasswordToken(null);
            usuario.setResetPasswordTokenExpiry(null);
            usuarioRepository.save(usuario);
            return;
        }

        // Buscar en Conductor
        Optional<Usuario> conductorOpt = usuarioRepository.findByResetPasswordToken(token);

        if (conductorOpt.isPresent()) {
            Usuario conductor = conductorOpt.get();
            if (isTokenExpired(conductor.getResetPasswordTokenExpiry())) {
                throw new RuntimeException("El token ha expirado");
            }
            // Encriptar la nueva contraseña
            conductor.setPassword(passwordEncoder.encode(newPassword));
            conductor.setResetPasswordToken(null);
            conductor.setResetPasswordTokenExpiry(null);
            usuarioRepository.save(conductor);
            return;
        }

        throw new RuntimeException("Token inválido");
    }

    private String generateToken() {
        return UUID.randomUUID().toString();
    }

    private boolean isTokenExpired(LocalDateTime tokenExpiry) {
        return tokenExpiry == null || LocalDateTime.now().isAfter(tokenExpiry);
    }

    private void sendResetEmail(String email, String token, String tipoUsuario) {
        String resetLink = baseUrl + "/auth/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(email);
        message.setSubject("Restablecimiento de contraseña");
        message.setText("Para restablecer tu contraseña, haz clic en el siguiente enlace: " + resetLink +
                "\n\nEste enlace expirará en 30 minutos.");

        mailSender.send(message);
    }
    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {





        // 1. Buscar al usuario (asumimos que es un Usuario o Conductor, ya que comparten repositorio)
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado.");
        }

        Usuario usuario = usuarioOpt.get();

        // 2. VERIFICACIÓN DE SEGURIDAD CRÍTICA
        // Comparamos la contraseña plana que ingresó con el Hash de la base de datos
        if (!passwordEncoder.matches(currentPassword, usuario.getPassword())) {
            throw new BadCredentialsException("La contraseña actual es incorrecta.");
        }

        // 3. Si pasa, encriptamos la nueva y guardamos
        usuario.setPassword(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);
    }


}

