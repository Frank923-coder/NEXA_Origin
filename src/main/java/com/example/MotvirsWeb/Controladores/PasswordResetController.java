package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Service.EmailService;
import com.example.MotvirsWeb.Service.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.UUID;

@Controller
@RequestMapping("/auth")
public class PasswordResetController {

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private EmailService emailService;

    @GetMapping("/forgot-password")
    public String showForgotPasswordForm(Model model) {
        return "auth/forgot-password";
    }

    // CORRECCIÓN DE DISEÑO: Cambiado de ResponseEntity a String (Redirect)
    @PostMapping("/forgot-password")
    public String processForgotPassword(@RequestParam String email, RedirectAttributes redirectAttributes) {
        try {
            passwordResetService.initiatePasswordReset(email);
            // Esto inyecta la variable 'success' que tu HTML está esperando
            redirectAttributes.addFlashAttribute("success", "Se ha enviado un enlace a tu correo.");
        } catch (Exception e) {
            // Esto inyecta la variable 'error' para tu alerta roja
            redirectAttributes.addFlashAttribute("error", "Error: " + e.getMessage());
        }
        return "redirect:/auth/forgot-password";
    }

    @GetMapping("/reset-password")
    public String showResetPasswordForm(@RequestParam String token, Model model) {
        model.addAttribute("token", token);
        return "auth/reset-password";
    }

    // CORRECCIÓN DE DISEÑO: Manejo consistente de la vista
    @PostMapping("/reset-password")
    public String processResetPassword(
            @RequestParam String token,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword, // Agregamos validación simple aquí también
            RedirectAttributes redirectAttributes) {

        if (!newPassword.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("error", "Las contraseñas no coinciden.");
            return "redirect:/auth/reset-password?token=" + token;
        }

        try {
            passwordResetService.resetPassword(token, newPassword);
            redirectAttributes.addFlashAttribute("success", "Contraseña restablecida exitosamente. Ya puedes iniciar sesión.");
            return "redirect:/auth/login"; // Redirigir al login tras éxito
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al restablecer: " + e.getMessage());
            return "redirect:/auth/reset-password?token=" + token;
        }
    }

    public void initiatePasswordReset(String email) {
        // 1. Verificar si el usuario existe...

        // 2. Generar y guardar el token...
        String token = UUID.randomUUID().toString();
        // guardarTokenEnBD(usuario, token);

        // 3. DELEGAR EL ENVÍO AL EMAIL SERVICE
        // Aquí es donde ocurre la magia. Pasamos el email del usuario y el token.
        emailService.enviarCorreoRecuperacion(email, token);
    }
}